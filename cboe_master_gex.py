"""
Cboe Official GEX Master Script (NDX / SPX / QQQ).
Pulls official delayed quotes directly from Cboe CDN (no API keys required).
Calculates 0DTE GEX Profile, Liquidity Map, Max Pain, Walls, and generates interactive Plotly dashboard.
"""
import sys
from datetime import datetime
import requests
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import re

# ==============================================================
# CONFIGURATION: DIRECT CBOE VERIFIED CDN ENDPOINT
# ==============================================================
# '_NDX' = Nasdaq-100 Cash Index (Maps 1:1 with NQ futures)
# '_SPX' = S&P 500 Cash Index (Maps 1:1 with ES futures)
# 'QQQ'  = Invesco QQQ Trust ETF
TARGET_SYMBOL = "_NDX" if len(sys.argv) < 2 else sys.argv[1].upper()
if TARGET_SYMBOL in ["NQ", "NDX"]:
    TARGET_SYMBOL = "_NDX"
elif TARGET_SYMBOL in ["ES", "SPX"]:
    TARGET_SYMBOL = "_SPX"

CBOE_URL = f"https://cdn.cboe.com/api/global/delayed_quotes/options/{TARGET_SYMBOL}.json"
HEADERS  = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

def calculate_max_pain(ladder):
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
    return float(strikes[np.argmin(losses)]) if len(losses) > 0 else 0.0

def run_cboe_gex_master(auto_open=True):
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Connecting directly to Cboe Official CDN ({TARGET_SYMBOL})...")
    
    try:
        res = requests.get(CBOE_URL, headers=HEADERS, timeout=15)
        if res.status_code != 200:
            print(f"Error: Could not connect to Cboe servers (status {res.status_code}).")
            return None
    except Exception as e:
        print(f"Error connecting to Cboe: {e}")
        return None

    payload = res.json().get('data', {})
    spot_price = float(payload.get('current_price', 0.0))
    raw_options = payload.get('options', [])
    today_code = datetime.now().strftime("%y%m%d")

    # 1. PARSE 0DTE OPTIONS FOR TODAY
    has_today = any(today_code in opt.get('option', '') for opt in raw_options)
    records = []
    for opt in raw_options:
        sym = opt.get('option', '')
        m = re.match(r"([A-Z_]+)(\d{6})([CP])(\d{8})", sym)
        if not m:
            continue
        _, exp, cp, strk_raw = m.groups()
        if has_today and exp != today_code:
            continue

        strike = float(strk_raw) / 1000.0
        opt_type = 'CALL' if cp == 'C' else 'PUT'
        records.append({
            'strike': strike,
            'type': opt_type,
            'gamma': float(opt.get('gamma') or 0.0),
            'open_interest': int(float(opt.get('open_interest') or 0)),
            'volume': int(float(opt.get('volume') or 0)),
            'iv': float(opt.get('iv') or 0.0)
        })

    if not records:
        print(f"No active option contracts found for {TARGET_SYMBOL}. (Market may be closed or pre-open).")
        return None

    df = pd.DataFrame(records)
    print(f"-> Successfully extracted {len(df)} active option contracts.")

    # 2. DOLLAR GEX & VEX CALCULATIONS
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

    # Filter strikes within +/- 4% of Spot for a high-signal view
    ladder = ladder[(ladder['strike'] >= spot_price * 0.96) & (ladder['strike'] <= spot_price * 1.04)]
    ladder = ladder.sort_values(by='strike').reset_index(drop=True)

    # 3. COMPUTE ALL STRUCTURAL LEVELS
    total_net_gex   = float(ladder['Net_GEX_$M'].sum())
    call_wall       = float(ladder.loc[ladder['Call_GEX_$M'].idxmax()]['strike']) if not ladder.empty else spot_price + 200
    put_wall        = float(ladder.loc[ladder['Put_GEX_$M'].idxmin()]['strike']) if not ladder.empty else spot_price - 200
    vol_call_magnet = float(ladder.loc[ladder['Call_VEX_$M'].idxmax()]['strike']) if (ladder['Call_VEX_$M'].max() > 0) else call_wall
    max_pain        = calculate_max_pain(ladder)

    # Zero Gamma Flip Level
    zero_gamma = spot_price
    for i in range(len(ladder) - 1):
        if ladder.loc[i, 'Net_GEX_$M'] <= 0 and ladder.loc[i+1, 'Net_GEX_$M'] > 0:
            zero_gamma = float(ladder.loc[i, 'strike'])
            break

    # 4. PRINT TERMINAL EXECUTIVE SUMMARY
    display_sym = "NQ (NDX)" if TARGET_SYMBOL == "_NDX" else "ES (SPX)" if TARGET_SYMBOL == "_SPX" else TARGET_SYMBOL
    print("\n" + "="*70)
    print(f"        CBOE OFFICIAL 0DTE GEX REPORT ({datetime.now().strftime('%Y-%m-%d')})")
    print("="*70)
    print(f"{display_sym} Spot Price: {spot_price:,.2f}")
    print("-" * 70)
    if total_net_gex > 0:
        print(f"CURRENT REGIME: POSITIVE GAMMA (+${total_net_gex:,.1f}M)")
        print("MARKET BIAS   : MEAN-REVERSION / ABSORPTION (Fade walls back to VWAP)")
    else:
        print(f"CURRENT REGIME: NEGATIVE GAMMA (-${abs(total_net_gex):,.1f}M)")
        print("MARKET BIAS   : TREND ACCELERATION / MOMENTUM (Trade wall breakouts)")
    print("-" * 70)
    print(f"1. 0DTE CALL WALL (Ceiling / Pin)      : {call_wall:,.0f}")
    print(f"2. ZERO GAMMA FLIP (Regime Trigger)    : {zero_gamma:,.0f}")
    print(f"3. 0DTE PUT WALL (Floor / Airbag)      : {put_wall:,.0f}")
    print(f"4. 0DTE VEX VOLUME MAGNET (Hot Money)  : {vol_call_magnet:,.0f}")
    print(f"5. MAX PAIN STRIKE (Afternoon Target)  : {max_pain:,.0f}")
    print("="*70)

    # 5. BUILD INTERACTIVE DASHBOARD (PROFILE & MAP)
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
            y=ladder['strike'], x=ladder['Call_GEX_$M'],
            name='Call GEX (+)', orientation='h',
            marker=dict(color='#00e676'), hovertemplate='Strike: %{y}<br>Call GEX: +$%{x:.1f}M<extra></extra>'
        ),
        row=1, col=1
    )
    fig.add_trace(
        go.Bar(
            y=ladder['strike'], x=ladder['Put_GEX_$M'],
            name='Put GEX (-)', orientation='h',
            marker=dict(color='#ff1744'), hovertemplate='Strike: %{y}<br>Put GEX: -$%{x:.1f}M<extra></extra>'
        ),
        row=1, col=1
    )
    fig.add_trace(
        go.Scatter(
            y=ladder['strike'], x=ladder['Net_GEX_$M'],
            name='Net GEX Curve', mode='lines+markers',
            line=dict(color='#2979ff', width=2), hovertemplate='Strike: %{y}<br>Net GEX: $%{x:.1f}M<extra></extra>'
        ),
        row=1, col=1
    )

    # Right: Gamma Liquidity Map (OI & Volume)
    fig.add_trace(
        go.Bar(
            y=ladder['strike'], x=ladder['Total_OI'],
            name='Open Interest (OI)', orientation='h',
            marker=dict(color='#b388ff', opacity=0.8), hovertemplate='Strike: %{y}<br>OI: %{x:,} contracts<extra></extra>'
        ),
        row=1, col=2
    )
    fig.add_trace(
        go.Bar(
            y=ladder['strike'], x=ladder['Total_Vol'],
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

    # Styling
    regime_title = "POSITIVE GAMMA (Mean-Reversion)" if total_net_gex > 0 else "NEGATIVE GAMMA (Trend Expansion)"
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

    # Output Visual HTML & CSV
    sym_name = TARGET_SYMBOL.replace("_", "").lower()
    html_file = f"cboe_{sym_name}_dashboard.html"
    csv_file  = f"cboe_{sym_name}_levels.csv"
    fig.write_html(html_file, auto_open=auto_open)
    ladder.to_csv(csv_file, index=False)
    print(f"\n[OK] Interactive Dashboard written: {html_file}")
    print(f"[OK] Full Strike Ladder exported to CSV: {csv_file}\n")
    return ladder

if __name__ == "__main__":
    run_cboe_gex_master(auto_open=True)
