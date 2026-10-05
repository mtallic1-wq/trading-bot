"""
Cboe Official GEX & 0DTE Gamma Exposure Engine.
Pulls official delayed options quotes directly from Cboe CDN (no API keys required).
Calculates Dollar GEX ($M), VEX ($M), Max Pain, Net Regime, Call/Put Walls, and Zero-Gamma Flip.
"""
import json
import os
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional

import requests
import pandas as pd
import numpy as np
import yfinance as yf

from config import PERSISTENT_DIR

CBOE_HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

def _calculate_max_pain(ladder: pd.DataFrame) -> float:
    """Calculates the strike where total expiring OI value is minimized."""
    if ladder.empty:
        return 0.0
    strikes = ladder['strike'].values
    call_oi = ladder['open_interest_Call'].values
    put_oi  = ladder['open_interest_Put'].values
    losses  = []
    for test_strike in strikes:
        call_loss = np.maximum(0, test_strike - strikes) * call_oi
        put_loss  = np.maximum(0, strikes - test_strike) * put_oi
        losses.append(np.sum(call_loss) + np.sum(put_loss))
    if not losses:
        return 0.0
    return float(strikes[np.argmin(losses)])


def fetch_cboe_gex(symbol: str = "NQ", force_refresh: bool = False) -> Dict[str, Any]:
    """
    Fetches official 0DTE options data from Cboe for NDX (NQ) or SPX (ES).
    Computes GEX/VEX ladders, structural walls, flip level, max pain, and regime.
    """
    sym_upper = symbol.upper()
    cboe_target = "_NDX" if "NQ" in sym_upper else "_SPX"
    cache_file = "nq_gamma_cache.json" if "NQ" in sym_upper else "gamma_cache.json"
    cache_path = PERSISTENT_DIR / "storage" / cache_file
    cache_path.parent.mkdir(exist_ok=True)

    # Check 15-minute disk cache unless force_refresh
    if not force_refresh and cache_path.exists():
        try:
            mtime = cache_path.stat().st_mtime
            if (time.time() - mtime) < 900:  # 15 mins
                with open(cache_path, "r", encoding="utf-8") as f:
                    cached = json.load(f)
                    if cached and "levels" in cached:
                        return cached
        except Exception:
            pass

    cboe_url = f"https://cdn.cboe.com/api/global/delayed_quotes/options/{cboe_target}.json"
    
    try:
        res = requests.get(cboe_url, headers=CBOE_HEADERS, timeout=12)
        if res.status_code != 200:
            raise ValueError(f"Cboe CDN returned status {res.status_code}")
            
        payload = res.json().get("data", {})
        spot_price = float(payload.get("current_price", 0.0))
        raw_options = payload.get("options", [])
        
        if not raw_options or spot_price <= 0:
            raise ValueError("Empty options data from Cboe payload")

        # Today's date code YYMMDD
        today_code = datetime.now().strftime("%y%m%d")
        has_today = any(today_code in opt.get("option", "") for opt in raw_options)

        records = []
        for opt in raw_options:
            sym_str = opt.get("option", "")
            # Option string format: NDX261005C30800000 or SPX261005P07700000
            m = re.match(r"([A-Z_]+)(\d{6})([CP])(\d{8})", sym_str)
            if not m:
                continue
            _, exp, cp, strk_raw = m.groups()
            
            # If 0DTE is active today, filter for today; otherwise use nearest active expiration
            if has_today and exp != today_code:
                continue

            strike = float(strk_raw) / 1000.0
            opt_type = "CALL" if cp == "C" else "PUT"
            gamma = float(opt.get("gamma") or 0.0)
            oi = int(float(opt.get("open_interest") or 0))
            vol = int(float(opt.get("volume") or 0))
            iv = float(opt.get("iv") or 0.0)

            records.append({
                "strike": strike,
                "type": opt_type,
                "gamma": gamma,
                "open_interest": oi,
                "volume": vol,
                "iv": iv,
                "expiration": exp
            })

        if not records:
            raise ValueError("No option records matched expiration filter")

        df = pd.DataFrame(records)

        # 2. Dollar GEX & VEX Calculations
        # Formula: Gamma * OI * 100 * Spot^2 / 1e6 ($ Millions)
        calls = df[df['type'] == 'CALL'].copy()
        puts  = df[df['type'] == 'PUT'].copy()

        calls['Call_GEX_$M'] = calls['gamma'] * calls['open_interest'] * 100 * (spot_price**2) / 1e6
        puts['Put_GEX_$M']   = -puts['gamma'] * puts['open_interest'] * 100 * (spot_price**2) / 1e6
        calls['Call_VEX_$M'] = calls['gamma'] * calls['volume'] * 100 * (spot_price**2) / 1e6
        puts['Put_VEX_$M']   = -puts['gamma'] * puts['volume'] * 100 * (spot_price**2) / 1e6

        ladder = pd.merge(
            calls[['strike', 'open_interest', 'volume', 'Call_GEX_$M', 'Call_VEX_$M']],
            puts[['strike', 'open_interest', 'volume', 'Put_GEX_$M', 'Put_VEX_$M']],
            on='strike', how='outer', suffixes=('_Call', '_Put')
        ).fillna(0)

        ladder['Net_GEX_$M'] = ladder['Call_GEX_$M'] + ladder['Put_GEX_$M']
        ladder['Net_VEX_$M'] = ladder['Call_VEX_$M'] + ladder['Put_VEX_$M']
        ladder['Total_OI']   = ladder['open_interest_Call'] + ladder['open_interest_Put']
        ladder['Total_Vol']  = ladder['volume_Call'] + ladder['volume_Put']

        # Filter strikes within +/- 5% of Spot for high signal
        ladder_filtered = ladder[(ladder['strike'] >= spot_price * 0.95) & (ladder['strike'] <= spot_price * 1.05)].copy()
        ladder_filtered = ladder_filtered.sort_values(by='strike').reset_index(drop=True)

        if ladder_filtered.empty:
            ladder_filtered = ladder.sort_values(by='strike').reset_index(drop=True)

        total_net_gex = float(ladder_filtered['Net_GEX_$M'].sum())
        
        # Call Wall (highest call GEX)
        call_wall_row = ladder_filtered.loc[ladder_filtered['Call_GEX_$M'].idxmax()] if not ladder_filtered.empty else None
        call_wall = float(call_wall_row['strike']) if call_wall_row is not None else (spot_price + 200)

        # Put Wall (lowest put GEX, most negative)
        put_wall_row = ladder_filtered.loc[ladder_filtered['Put_GEX_$M'].idxmin()] if not ladder_filtered.empty else None
        put_wall = float(put_wall_row['strike']) if put_wall_row is not None else (spot_price - 200)

        # Volume Call Magnet (Hot Money Magnet)
        has_vex = ladder_filtered['Call_VEX_$M'].max() > 0
        if has_vex:
            vol_magnet_row = ladder_filtered.loc[ladder_filtered['Call_VEX_$M'].idxmax()]
            vol_call_magnet = float(vol_magnet_row['strike'])
        else:
            vol_call_magnet = call_wall

        # Max Pain Strike
        max_pain = _calculate_max_pain(ladder_filtered)
        if max_pain <= 0:
            max_pain = spot_price

        # Zero Gamma Flip Level
        zero_gamma = spot_price
        for i in range(len(ladder_filtered) - 1):
            if ladder_filtered.loc[i, 'Net_GEX_$M'] <= 0 and ladder_filtered.loc[i+1, 'Net_GEX_$M'] > 0:
                zero_gamma = float(ladder_filtered.loc[i, 'strike'])
                break

        regime_name = "Positive Gamma (+GEX)" if total_net_gex > 0 else "Negative Gamma (-GEX)"

        # Prepare compact ladder structure for frontend charts
        ladder_json = []
        for _, row in ladder_filtered.iterrows():
            ladder_json.append({
                "strike": float(row["strike"]),
                "call_gex": round(float(row["Call_GEX_$M"]), 2),
                "put_gex": round(float(row["Put_GEX_$M"]), 2),
                "net_gex": round(float(row["Net_GEX_$M"]), 2),
                "call_vex": round(float(row["Call_VEX_$M"]), 2),
                "put_vex": round(float(row["Put_VEX_$M"]), 2),
                "oi_call": int(row["open_interest_Call"]),
                "oi_put": int(row["open_interest_Put"]),
                "total_oi": int(row["Total_OI"]),
                "total_vol": int(row["Total_Vol"]),
            })

        result = {
            "symbol": sym_upper,
            "cboe_target": cboe_target,
            "underlying_price": round(spot_price, 2),
            "as_of": datetime.utcnow().isoformat() + "Z",
            "session_date": datetime.now().strftime("%Y-%m-%d"),
            "total_net_gex_m": round(total_net_gex, 1),
            "regime": regime_name,
            "levels": {
                "gamma_flip": round(zero_gamma, 1),
                "call_wall": round(call_wall, 1),
                "put_wall": round(put_wall, 1),
                "zero_dte_magnet": str(round(vol_call_magnet, 1)),
                "max_pain": round(max_pain, 1),
                "vol_call_magnet": round(vol_call_magnet, 1),
            },
            "ladder": ladder_json,
            "source": f"Cboe Official 0DTE Feed ({cboe_target})",
        }

        # Cache to disk
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2)
        except Exception:
            pass

        return result

    except Exception as e:
        # Fallback to stale cache if available
        if cache_path.exists():
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    cached = json.load(f)
                    if cached and "levels" in cached:
                        cached["warning"] = f"Using cached data (Cboe fetch exception: {e})"
                        return cached
            except Exception:
                pass

        # Real-time yfinance estimation fallback if Cboe network fails
        try:
            ticker_sym = "NQ=F" if "NQ" in sym_upper else "ES=F"
            spot = yf.Ticker(ticker_sym).fast_info.last_price or (30000.0 if "NQ" in sym_upper else 7500.0)
        except Exception:
            spot = 30000.0 if "NQ" in sym_upper else 7500.0

        step = 10 if "NQ" in sym_upper else 5
        flip = round((spot - 80) / step) * step
        call_wall = round((spot + 200) / step) * step
        put_wall = round((spot - 300) / step) * step
        magnet = round((spot + 40) / step) * step

        return {
            "symbol": sym_upper,
            "cboe_target": cboe_target,
            "underlying_price": round(spot, 2),
            "as_of": datetime.utcnow().isoformat() + "Z",
            "session_date": datetime.now().strftime("%Y-%m-%d"),
            "total_net_gex_m": 0.0,
            "regime": "Positive Gamma (+GEX)",
            "levels": {
                "gamma_flip": flip,
                "call_wall": call_wall,
                "put_wall": put_wall,
                "zero_dte_magnet": str(magnet),
                "max_pain": flip,
                "vol_call_magnet": magnet,
            },
            "ladder": [],
            "warning": f"Estimated boundaries shown (Cboe fetch exception: {e})",
            "source": "Fallback Estimation Feed",
        }


def generate_gex_dashboard_html(symbol: str = "NQ") -> str:
    """
    Generates an interactive standalone Plotly HTML dashboard for 0DTE GEX Profile and Gamma Liquidity Map.
    """
    import plotly.graph_objects as go
    from plotly.subplots import make_subplots

    data = fetch_cboe_gex(symbol, force_refresh=False)
    ladder_data = data.get("ladder", [])
    spot_price = data.get("underlying_price", 0.0)
    levels = data.get("levels", {})
    call_wall = levels.get("call_wall", spot_price + 100)
    put_wall = levels.get("put_wall", spot_price - 100)
    zero_gamma = levels.get("gamma_flip", spot_price)
    max_pain = levels.get("max_pain", spot_price)
    vol_call_magnet = levels.get("vol_call_magnet", call_wall)
    total_net_gex = data.get("total_net_gex_m", 0.0)
    display_sym = "NQ (NDX)" if "NQ" in symbol.upper() else "ES (SPX)"

    if not ladder_data:
        return f"""
        <html><body style="background:#121212; color:#fff; font-family:sans-serif; text-align:center; padding:50px;">
        <h2>No 0DTE Ladder data currently available for {display_sym}</h2>
        <p>Market may be closed or options data is still updating.</p>
        </body></html>
        """

    df = pd.DataFrame(ladder_data)
    
    fig = make_subplots(
        rows=1, cols=2,
        shared_yaxes=True,
        horizontal_spacing=0.04,
        subplot_titles=(
            "<b>0DTE Gamma Profile (Dealer Hedging Walls)</b>",
            "<b>0DTE Gamma Liquidity Map (OI & Volume Heatmap)</b>"
        )
    )

    # Left: Gamma Profile
    fig.add_trace(
        go.Bar(
            y=df['strike'], x=df['call_gex'],
            name='Call GEX (+)', orientation='h',
            marker=dict(color='#00e676'), hovertemplate='Strike: %{y}<br>Call GEX: +$%{x:.1f}M<extra></extra>'
        ),
        row=1, col=1
    )
    fig.add_trace(
        go.Bar(
            y=df['strike'], x=df['put_gex'],
            name='Put GEX (-)', orientation='h',
            marker=dict(color='#ff1744'), hovertemplate='Strike: %{y}<br>Put GEX: -$%{x:.1f}M<extra></extra>'
        ),
        row=1, col=1
    )
    fig.add_trace(
        go.Scatter(
            y=df['strike'], x=df['net_gex'],
            name='Net GEX Curve', mode='lines+markers',
            line=dict(color='#2979ff', width=2), hovertemplate='Strike: %{y}<br>Net GEX: $%{x:.1f}M<extra></extra>'
        ),
        row=1, col=1
    )

    # Right: Gamma Liquidity Map (OI & Volume)
    fig.add_trace(
        go.Bar(
            y=df['strike'], x=df['total_oi'],
            name='Open Interest (OI)', orientation='h',
            marker=dict(color='#b388ff', opacity=0.8), hovertemplate='Strike: %{y}<br>OI: %{x:,} contracts<extra></extra>'
        ),
        row=1, col=2
    )
    fig.add_trace(
        go.Bar(
            y=df['strike'], x=df['total_vol'],
            name='0DTE Volume', orientation='h',
            marker=dict(color='#ff9100', opacity=0.85), hovertemplate='Strike: %{y}<br>Vol: %{x:,} contracts<extra></extra>'
        ),
        row=1, col=2
    )

    # Add Structural Benchmark Lines
    for col in [1, 2]:
        fig.add_hline(y=spot_price, line_dash="dash", line_color="#ffd600", line_width=2,
                      annotation_text=f"Spot: {spot_price:,.0f}", annotation_position="top left", row=1, col=col)
        fig.add_hline(y=call_wall, line_color="#00e676", line_width=2,
                      annotation_text=f"Call Wall: {call_wall:,.0f}", annotation_position="top right", row=1, col=col)
        fig.add_hline(y=put_wall, line_color="#ff1744", line_width=2,
                      annotation_text=f"Put Wall: {put_wall:,.0f}", annotation_position="bottom right", row=1, col=col)
        fig.add_hline(y=zero_gamma, line_dash="dot", line_color="#00e5ff", line_width=1.5,
                      annotation_text=f"Flip: {zero_gamma:,.0f}", annotation_position="bottom left", row=1, col=col)
        fig.add_hline(y=max_pain, line_dash="dashdot", line_color="#e040fb", line_width=1.5,
                      annotation_text=f"Max Pain: {max_pain:,.0f}", annotation_position="top right", row=1, col=col)

    regime_title = f"POSITIVE GAMMA (+${total_net_gex:,.1f}M)" if total_net_gex > 0 else f"NEGATIVE GAMMA (-${abs(total_net_gex):,.1f}M)"
    fig.update_layout(
        title=dict(
            text=f"<b>CBOE {display_sym} 0DTE GEX PROFILE & GAMMA MAP</b> | <span style='font-size:14px; color:#aaa;'>Regime: {regime_title}</span>",
            x=0.03, y=0.96
        ),
        barmode='relative',
        template='plotly_dark',
        paper_bgcolor='#121212',
        plot_bgcolor='#181818',
        height=850,
        showlegend=True,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )
    fig.update_xaxes(title_text="Dollar GEX ($ Millions)", row=1, col=1)
    fig.update_xaxes(title_text="Contracts (OI / Volume)", row=1, col=2)
    fig.update_yaxes(title_text=f"{display_sym} Strike Price (Points)", row=1, col=1)

    return fig.to_html(include_plotlyjs='cdn', full_html=True)

