import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    # Initialize Presentation (16:9 Widescreen)
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Elite Institutional Dark Color Palette
    BG_COLOR = RGBColor(11, 15, 25)          # Deep Midnight Slate #0B0F19
    CARD_BG = RGBColor(22, 30, 46)          # Sleek Slate Card #161E2E
    CARD_BG_ALT = RGBColor(17, 24, 39)      # Darker Sub-Card #111827
    CARD_BORDER = RGBColor(45, 60, 88)      # Subtle Border #2D3C58
    CARD_BORDER_BRIGHT = RGBColor(71, 85, 105)

    ACCENT_CYAN = RGBColor(56, 189, 248)    # Electric Ice Blue #38BDF8
    ACCENT_GREEN = RGBColor(34, 197, 94)    # Bullish Green #22C55E
    ACCENT_RED = RGBColor(239, 68, 68)      # Bearish Red #EF4444
    ACCENT_AMBER = RGBColor(245, 158, 11)   # Warning / Gold #F59E0B
    ACCENT_PURPLE = RGBColor(168, 85, 247)  # Violet / Deep Insight #A855F7

    TEXT_WHITE = RGBColor(248, 250, 252)    # Clean Off-white #F8FAFC
    TEXT_MUTED = RGBColor(156, 163, 175)    # Medium Cool Gray #9CA3AF
    TEXT_LIGHT_GRAY = RGBColor(209, 213, 219) # Light Cool Gray #D1D5DB

    FONT_HEADING = "Segoe UI"
    FONT_BODY = "Segoe UI"
    FONT_CODE = "Consolas"

    blank_layout = prs.slide_layouts[6]

    def apply_slide_bg(slide):
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = BG_COLOR
        bg_shape.line.fill.background()
        return bg_shape

    def add_header(slide, title, category, slide_num=None):
        # Category badge / breadcrumb
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(8.5), Inches(0.3))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = tf_cat.margin_right = tf_cat.margin_top = tf_cat.margin_bottom = 0
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.name = FONT_HEADING
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_CYAN
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.68), Inches(10.5), Inches(0.55))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_right = tf_title.margin_top = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title
        p_title.font.name = FONT_HEADING
        p_title.font.size = Pt(21)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE
        
        # Divider line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.28), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = CARD_BORDER
        line.line.fill.background()
        
        # Footer Tracker
        if slide_num:
            foot_box = slide.shapes.add_textbox(Inches(8.5), Inches(0.45), Inches(4.033), Inches(0.35))
            tf_foot = foot_box.text_frame
            tf_foot.margin_left = tf_foot.margin_right = tf_foot.margin_top = tf_foot.margin_bottom = 0
            p_foot = tf_foot.paragraphs[0]
            p_foot.alignment = PP_ALIGN.RIGHT
            p_foot.text = f"NQ ORDER FLOW PLAYBOOK  |  {slide_num:02d} / 12"
            p_foot.font.name = FONT_CODE
            p_foot.font.size = Pt(8.5)
            p_foot.font.color.rgb = TEXT_MUTED

    def create_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.2)
        else:
            card.line.fill.background()
        return card

    # ==========================================
    # SLIDE 1: TITLE SLIDE
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide1)

    # Accent decorative top bar
    top_bar = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.8), Inches(2.2), Inches(0.06))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = ACCENT_CYAN
    top_bar.line.fill.background()

    # Category Tag
    tag_box = slide1.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(8.0), Inches(0.4))
    tf_tag = tag_box.text_frame
    tf_tag.margin_left = tf_tag.margin_right = tf_tag.margin_top = tf_tag.margin_bottom = 0
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = "INSTITUTIONAL DERIVATIVES & MICROSTRUCTURE PLAYBOOK"
    p_tag.font.name = FONT_CODE
    p_tag.font.size = Pt(11)
    p_tag.font.bold = True
    p_tag.font.color.rgb = ACCENT_CYAN

    # Main Title
    main_title_box = slide1.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.7), Inches(1.5))
    tf_mt = main_title_box.text_frame
    tf_mt.word_wrap = True
    tf_mt.margin_left = tf_mt.margin_right = tf_mt.margin_top = tf_mt.margin_bottom = 0
    p_mt = tf_mt.paragraphs[0]
    p_mt.text = "MASTERING NQ ORDER FLOW"
    p_mt.font.name = FONT_HEADING
    p_mt.font.size = Pt(44)
    p_mt.font.bold = True
    p_mt.font.color.rgb = TEXT_WHITE

    p_sub = tf_mt.add_paragraph()
    p_sub.text = "Microstructure, Footprint Diagnostics & Tactical Playbooks for E-mini & Micro Nasdaq-100 Futures"
    p_sub.font.name = FONT_HEADING
    p_sub.font.size = Pt(18)
    p_sub.font.color.rgb = TEXT_MUTED
    p_sub.space_before = Pt(12)

    # 4 Quick Stat Cards at Bottom of Title Slide
    stat_cards_data = [
        ("CME GLOBEX: NQ / MNQ", "$20 / pt ($5 / tick) - MNQ: $2 / pt", "High Beta, Volatility & Fast Sweeps", ACCENT_CYAN),
        ("MATCHING ENGINE", "Pure FIFO + MBO Queue", "First In First Out order priority", ACCENT_PURPLE),
        ("CORE ENGINE", "Passive Limits vs Aggressive Orders", "Price moves strictly on liquidity imbalance", ACCENT_GREEN),
        ("TACTICAL EDGE", "Absorption, CVD & Footprint", "Institutional footprint retest plays", ACCENT_AMBER)
    ]
    card_w = Inches(2.76)
    card_h = Inches(2.6)
    card_gap = Inches(0.23)
    start_left = Inches(0.8)
    card_top = Inches(3.9)

    for i, (head, val, desc, acc_col) in enumerate(stat_cards_data):
        c_left = start_left + i * (card_w + card_gap)
        create_card(slide1, c_left, card_top, card_w, card_h, bg_color=CARD_BG, border_color=CARD_BORDER)
        
        # Pill bar inside card
        p_bar = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, c_left + Inches(0.25), card_top + Inches(0.25), Inches(0.4), Inches(0.04))
        p_bar.fill.solid()
        p_bar.fill.fore_color.rgb = acc_col
        p_bar.line.fill.background()

        tb = slide1.shapes.add_textbox(c_left + Inches(0.25), card_top + Inches(0.45), card_w - Inches(0.5), card_h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        
        p1 = tf.paragraphs[0]
        p1.text = head
        p1.font.name = FONT_CODE
        p1.font.size = Pt(9.5)
        p1.font.bold = True
        p1.font.color.rgb = acc_col
        
        p2 = tf.add_paragraph()
        p2.text = val
        p2.font.name = FONT_HEADING
        p2.font.size = Pt(13.5)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_WHITE
        p2.space_before = Pt(8)
        
        p3 = tf.add_paragraph()
        p3.text = desc
        p3.font.name = FONT_BODY
        p3.font.size = Pt(11)
        p3.font.color.rgb = TEXT_MUTED
        p3.space_before = Pt(6)

    # Footnote
    fn_box = slide1.shapes.add_textbox(Inches(0.8), Inches(6.8), Inches(11.733), Inches(0.35))
    tf_fn = fn_box.text_frame
    tf_fn.margin_left = tf_fn.margin_right = tf_fn.margin_top = tf_fn.margin_bottom = 0
    p_fn = tf_fn.paragraphs[0]
    p_fn.text = "Institutional Trading Desk Edition  |  CME Group Equity Index Derivatives  |  Proprietary Execution Architecture"
    p_fn.font.name = FONT_CODE
    p_fn.font.size = Pt(8.5)
    p_fn.font.color.rgb = CARD_BORDER_BRIGHT

    # ==========================================
    # SLIDE 2: NQ MICROSTRUCTURE & UNIQUENESS
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide2)
    add_header(slide2, "The Microstructure of NQ: Why Order Flow is Mandatory", "Asset Profile & CME Globex Architecture", 2)

    col_w = Inches(3.72)
    col_h = Inches(5.6)
    col_gap = Inches(0.28)
    col_top = Inches(1.5)

    # Card 1: Extreme Velocity & High Beta
    c1 = create_card(slide2, Inches(0.8), col_top, col_w, col_h)
    tb1 = slide2.shapes.add_textbox(Inches(1.05), col_top + Inches(0.3), col_w - Inches(0.5), col_h - Inches(0.6))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_right = tf1.margin_top = tf1.margin_bottom = 0

    p = tf1.paragraphs[0]
    p.text = "HIGH BETA & VELOCITY"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    items_c1 = [
        ("Massive Daily Range", "Average True Range (ATR) is typically 250 - 450+ points ($5,000 to $9,000+ per full NQ contract). Micro moves happen in seconds."),
        ("Tech Megacap Dominance", "Top 7 tech names (AAPL, MSFT, NVDA, AMZN, META, GOOGL, TSLA) command >50% index weight. Correlated basket arbitrage triggers violent multi-tick cascades."),
        ("Candlestick Lag", "Standard time candles (1m, 5m) aggregate away the most critical micro-reversals. Only order flow reveals the battle inside each tick.")
    ]
    for title, desc in items_c1:
        p_t = tf1.add_paragraph()
        p_t.text = f"• {title}"
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(12.5)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(14)
        
        p_d = tf1.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(4)

    # Card 2: Book Thinness vs ES
    c2 = create_card(slide2, Inches(0.8) + col_w + col_gap, col_top, col_w, col_h)
    tb2 = slide2.shapes.add_textbox(Inches(1.05) + col_w + col_gap, col_top + Inches(0.3), col_w - Inches(0.5), col_h - Inches(0.6))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    tf2.margin_left = tf2.margin_right = tf2.margin_top = tf2.margin_bottom = 0

    p = tf2.paragraphs[0]
    p.text = "BOOK THINNESS VS ES"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    items_c2 = [
        ("Shallow Resting Depth", "NQ resting depth is typically only 15 to 40 contracts per tick, compared to ES (S&P 500) which has 250 to 1,000+ contracts per tick."),
        ("Multi-Tick Sweeps", "A single institutional market order of 50-100 contracts will punch through 4 to 8 price levels instantly, creating high slippage for market orders."),
        ("Liquidity Voids", "During economic data releases (CPI, FOMC), depth drops to 2-5 contracts per tick. Understanding order book exhaustion protects against severe drawdowns.")
    ]
    for title, desc in items_c2:
        p_t = tf2.add_paragraph()
        p_t.text = f"• {title}"
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(12.5)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(14)
        
        p_d = tf2.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(4)

    # Card 3: CME Globex Matching Engine
    c3 = create_card(slide2, Inches(0.8) + (col_w + col_gap)*2, col_top, col_w, col_h)
    tb3 = slide2.shapes.add_textbox(Inches(1.05) + (col_w + col_gap)*2, col_top + Inches(0.3), col_w - Inches(0.5), col_h - Inches(0.6))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    tf3.margin_left = tf3.margin_right = tf3.margin_top = tf3.margin_bottom = 0

    p = tf3.paragraphs[0]
    p.text = "CME GLOBEX SPECIFICATIONS"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN

    items_c3 = [
        ("Pure FIFO Matching", "CME Globex matches NQ orders via First In, First Out (FIFO). Time priority is absolute: early limit orders get filled first."),
        ("MBO (Market By Order)", "CME provides individual order ID transparency. Institutional platforms track exact queue position and individual cancellations."),
        ("Contract Multipliers", "NQ: $20 / point ($5 / 0.25 tick). MNQ: $2 / point ($0.50 / 0.25 tick). Margin requirements and intraday risk demand strict precision.")
    ]
    for title, desc in items_c3:
        p_t = tf3.add_paragraph()
        p_t.text = f"• {title}"
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(12.5)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(14)
        
        p_d = tf3.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(4)

    # ==========================================
    # SLIDE 3: PASSIVE VS AGGRESSIVE ORDERS
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide3)
    add_header(slide3, "Market Mechanics: Passive vs Aggressive Liquidity", "Auction Market Theory & The Matching Engine", 3)

    card_split_w = Inches(5.72)
    card_split_h = Inches(4.3)
    card_split_top = Inches(1.5)

    # Left: Passive Liquidity
    c_pass = create_card(slide3, Inches(0.8), card_split_top, card_split_w, card_split_h)
    tb_p = slide3.shapes.add_textbox(Inches(1.1), card_split_top + Inches(0.3), card_split_w - Inches(0.6), card_split_h - Inches(0.6))
    tf_p = tb_p.text_frame
    tf_p.word_wrap = True
    tf_p.margin_left = tf_p.margin_right = tf_p.margin_top = tf_p.margin_bottom = 0

    p = tf_p.paragraphs[0]
    p.text = "PASSIVE LIQUIDITY (THE BRAKES & ABSORPTION)"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    pass_bullets = [
        ("Instrument", "Limit Orders (Buy Limit on Bid, Sell Limit on Offer / Ask)."),
        ("Location", "Resting in the Depth of Market (DOM / Level 2 book)."),
        ("Market Function", "Provides market liquidity. They do NOT move price by themselves; they stand as barriers to halt price advances."),
        ("Institutional Utilization", "Institutions accumulate massive positions through passive limits or hidden Iceberg orders to avoid paying spread slippage."),
        ("Behavior under Stress", "Can be cancelled ('pulled') in microseconds by algorithms, causing liquidity vacuums and sharp flash sweeps.")
    ]
    for title, desc in pass_bullets:
        p_t = tf_p.add_paragraph()
        p_t.text = f"• {title}: "
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(11.5)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(8)
        run = p_t.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # Right: Aggressive Liquidity
    c_agg = create_card(slide3, Inches(0.8) + card_split_w + Inches(0.29), card_split_top, card_split_w, card_split_h)
    tb_a = slide3.shapes.add_textbox(Inches(1.1) + card_split_w + Inches(0.29), card_split_top + Inches(0.3), card_split_w - Inches(0.6), card_split_h - Inches(0.6))
    tf_a = tb_a.text_frame
    tf_a.word_wrap = True
    tf_a.margin_left = tf_a.margin_right = tf_a.margin_top = tf_a.margin_bottom = 0

    p = tf_a.paragraphs[0]
    p.text = "AGGRESSIVE LIQUIDITY (THE ENGINE & ACCELERATOR)"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN

    agg_bullets = [
        ("Instrument", "Market Orders & Stop-Loss Orders (which become Market Orders when hit)."),
        ("Location", "Printed immediately on the Time & Sales tape and inside Footprint clusters."),
        ("Market Function", "Consumes resting liquidity. Demands immediate execution across the spread ('lifts the ask' or 'hits the bid')."),
        ("Price Movement Law", "Price moves UP only when all resting sell limits at the Ask are exhausted by aggressive market buys, forcing the next tick."),
        ("Trapped Aggression", "Aggressive market buyers buying at highs into hidden institutional sell limits become trapped liquidity, fueling rapid reversals.")
    ]
    for title, desc in agg_bullets:
        p_t = tf_a.add_paragraph()
        p_t.text = f"• {title}: "
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(11.5)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(8)
        run = p_t.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED

    # Bottom Full-Width Insight Card
    c_bot = create_card(slide3, Inches(0.8), Inches(6.0), Inches(11.733), Inches(1.1), bg_color=CARD_BG_ALT, border_color=ACCENT_CYAN)
    tb_b = slide3.shapes.add_textbox(Inches(1.1), Inches(6.12), Inches(11.133), Inches(0.85))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = tf_b.margin_bottom = 0

    p_b1 = tf_b.paragraphs[0]
    p_b1.text = "THE AXIOM OF AUCTION MARKET THEORY:"
    p_b1.font.name = FONT_CODE
    p_b1.font.size = Pt(10)
    p_b1.font.bold = True
    p_b1.font.color.rgb = ACCENT_CYAN

    p_b2 = tf_b.add_paragraph()
    p_b2.text = "\"Price advertises opportunity, Volume validates participation, and Time regulates value.\" Heavy volume without price progress is the ultimate proof of institutional absorption."
    p_b2.font.name = FONT_HEADING
    p_b2.font.size = Pt(12)
    p_b2.font.bold = True
    p_b2.font.color.rgb = TEXT_WHITE
    p_b2.space_before = Pt(3)

    # ==========================================
    # SLIDE 4: THE ORDER FLOW TOOL SUITE
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide4)
    add_header(slide4, "The Order Flow Tool Suite: The Institutional Stack", "Diagnostic Technology & Workspace Architecture", 4)

    grid_w = Inches(5.72)
    grid_h = Inches(2.65)
    grid_gap_x = Inches(0.29)
    grid_gap_y = Inches(0.25)

    tools_data = [
        ("1. DEPTH OF MARKET (DOM / LEVEL 2)", ACCENT_CYAN,
         "Visualizes resting limit orders across multiple price tiers.",
         [("Queue Priority", "Tracks individual queue position under CME FIFO matching."),
          ("Pulling & Stacking", "Detects algorithmic size manipulation, spoofing, and real replenishment."),
          ("Primary Use", "Micro-execution, scalping precision, and real-time resistance monitoring.")]),

        ("2. FOOTPRINT CHARTS (BID x ASK)", ACCENT_GREEN,
         "Inside-the-candle volume distribution at every exact price tick.",
         [("Aggressive Volume", "Splits aggressive sell volume (Bid) and aggressive buy volume (Ask)."),
          ("Imbalances & Traps", "Highlights 300%+ volume imbalances and exhaustion prints instantly."),
          ("Primary Use", "Confirming trade entry triggers and diagnosing trapped participants.")]),

        ("3. CUMULATIVE VOLUME DELTA (CVD)", ACCENT_PURPLE,
         "Continuous running tally of Aggressive Buys minus Aggressive Sells.",
         [("Absorption Divergence", "Price prints lower low while CVD prints higher low (institutional buying)."),
          ("Trend Validation", "Validates whether new highs are backed by net aggressive capital."),
          ("Primary Use", "Macro-session bias, divergence discovery, and trend health verification.")]),

        ("4. VOLUME & MARKET PROFILE (VP / TPO)", ACCENT_AMBER,
         "Aggregates volume over price to reveal fair value distribution.",
         [("Key Reference Points", "Point of Control (POC), Value Area High (VAH), Value Area Low (VAL)."),
          ("HVN vs LVN", "High Volume Nodes act as magnets; Low Volume Nodes act as rapid transit zones."),
          ("Primary Use", "Framing structural context, determining targets, and defining trade boundaries.")])
    ]

    for idx, (title, col, summary, details) in enumerate(tools_data):
        row = idx // 2
        c_idx = idx % 2
        x = Inches(0.8) + c_idx * (grid_w + grid_gap_x)
        y = Inches(1.5) + row * (grid_h + grid_gap_y)
        
        create_card(slide4, x, y, grid_w, grid_h)
        tb = slide4.shapes.add_textbox(x + Inches(0.3), y + Inches(0.25), grid_w - Inches(0.6), grid_h - Inches(0.5))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.name = FONT_CODE
        p.font.size = Pt(11.5)
        p.font.bold = True
        p.font.color.rgb = col
        
        p_sub = tf.add_paragraph()
        p_sub.text = summary
        p_sub.font.name = FONT_HEADING
        p_sub.font.size = Pt(11)
        p_sub.font.bold = True
        p_sub.font.color.rgb = TEXT_WHITE
        p_sub.space_before = Pt(4)
        
        for k, v in details:
            p_d = tf.add_paragraph()
            p_d.text = f"• {k}: "
            p_d.font.name = FONT_BODY
            p_d.font.size = Pt(10)
            p_d.font.bold = True
            p_d.font.color.rgb = TEXT_LIGHT_GRAY
            p_d.space_before = Pt(3)
            r = p_d.add_run()
            r.text = v
            r.font.bold = False
            r.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 5: DECONSTRUCTING THE FOOTPRINT CHART
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide5)
    add_header(slide5, "Deconstructing the Footprint Chart for NQ", "Inside-Bar Order Execution & Imbalance Metrics", 5)

    fp_col_w = Inches(3.72)
    fp_col_h = Inches(5.6)
    fp_top = Inches(1.5)

    # Footprint 1: The Diagonal Comparison
    create_card(slide5, Inches(0.8), fp_top, fp_col_w, fp_col_h)
    tb_fp1 = slide5.shapes.add_textbox(Inches(1.05), fp_top + Inches(0.3), fp_col_w - Inches(0.5), fp_col_h - Inches(0.6))
    tf_fp1 = tb_fp1.text_frame
    tf_fp1.word_wrap = True
    tf_fp1.margin_left = tf_fp1.margin_right = tf_fp1.margin_top = tf_fp1.margin_bottom = 0

    p = tf_fp1.paragraphs[0]
    p.text = "DIAGONAL BID/ASK COMPARISON"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    fp1_points = [
        ("The Mechanics", "Aggressive buys lift the Ask at Price (P+0.25), while aggressive sells hit the Bid at Price (P). Footprints compare volume diagonally."),
        ("Standard Ratio Threshold", "Institutional setups use 300% to 400% imbalance ratios. An Ask volume of 350 vs a Bid of 50 = 700% diagonal buy imbalance."),
        ("NQ Context", "Because NQ is fast and thin, single-tick imbalances occur frequently. Never trade a single imbalance without structural location.")
    ]
    for t, d in fp1_points:
        pt = tf_fp1.add_paragraph()
        pt.text = f"• {t}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(14)
        pd = tf_fp1.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(4)

    # Footprint 2: Stacked Imbalances
    create_card(slide5, Inches(0.8) + fp_col_w + Inches(0.28), fp_top, fp_col_w, fp_col_h)
    tb_fp2 = slide5.shapes.add_textbox(Inches(1.05) + fp_col_w + Inches(0.28), fp_top + Inches(0.3), fp_col_w - Inches(0.5), fp_col_h - Inches(0.6))
    tf_fp2 = tb_fp2.text_frame
    tf_fp2.word_wrap = True
    tf_fp2.margin_left = tf_fp2.margin_right = tf_fp2.margin_top = tf_fp2.margin_bottom = 0

    p = tf_fp2.paragraphs[0]
    p.text = "STACKED IMBALANCES (INITIATIVE)"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN

    fp2_points = [
        ("Institutional Signature", "3 or more consecutive price levels printing diagonal imbalances in the same direction within a candle (e.g. 3 consecutive green Ask imbalances)."),
        ("Origin & Meaning", "Signifies institutional sweeping algorithms or HFT momentum cascades eating all resting depth across multiple ticks."),
        ("Actionable Playbook", "The stacked imbalance block becomes high-conviction support/resistance. On a first pullback, price routinely bounces off this exact price shelf.")
    ]
    for t, d in fp2_points:
        pt = tf_fp2.add_paragraph()
        pt.text = f"• {t}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(14)
        pd = tf_fp2.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(4)

    # Footprint 3: Unfinished Auctions
    create_card(slide5, Inches(0.8) + (fp_col_w + Inches(0.28))*2, fp_top, fp_col_w, fp_col_h)
    tb_fp3 = slide5.shapes.add_textbox(Inches(1.05) + (fp_col_w + Inches(0.28))*2, fp_top + Inches(0.3), fp_col_w - Inches(0.5), fp_col_h - Inches(0.6))
    tf_fp3 = tb_fp3.text_frame
    tf_fp3.word_wrap = True
    tf_fp3.margin_left = tf_fp3.margin_right = tf_fp3.margin_top = tf_fp3.margin_bottom = 0

    p = tf_fp3.paragraphs[0]
    p.text = "UNFINISHED AUCTIONS (POOR EXTREMES)"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    fp3_points = [
        ("The Zero Print Concept", "A finished auction at a bar high or low must show an exhaustion print (e.g. 0 x 45 at high, meaning no buyers bid higher)."),
        ("Unfinished Condition", "If both Bid and Ask trade substantial volume at the absolute candle extreme (e.g. 78 x 112 at high), the auction was cut off mid-trade."),
        ("NQ Probability", "NQ revisits and prints through >80% of intraday unfinished auctions within the same or following trading session. They act as high-probability magnet targets.")
    ]
    for t, d in fp3_points:
        pt = tf_fp3.add_paragraph()
        pt.text = f"• {t}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(14)
        pd = tf_fp3.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(4)

    # ==========================================
    # SLIDE 6: ABSORPTION VS EXHAUSTION
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide6)
    add_header(slide6, "Absorption vs Exhaustion: The Two Reversal Signatures", "Core Order Flow Mechanics for Major Market Turning Points", 6)

    comp_w = Inches(5.72)
    comp_h = Inches(5.6)
    comp_top = Inches(1.5)

    # Panel 1: Absorption
    create_card(slide6, Inches(0.8), comp_top, comp_w, comp_h)
    tb_abs = slide6.shapes.add_textbox(Inches(1.1), comp_top + Inches(0.3), comp_w - Inches(0.6), comp_h - Inches(0.6))
    tf_abs = tb_abs.text_frame
    tf_abs.word_wrap = True
    tf_abs.margin_left = tf_abs.margin_right = tf_abs.margin_top = tf_abs.margin_bottom = 0

    p = tf_abs.paragraphs[0]
    p.text = "ABSORPTION (PASSIVE INSTITUTIONAL WALL)"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    abs_sections = [
        ("Microstructure Reality", "Aggressive traders flood the market with market sell orders, but price refuses to fall because an institution is absorbing all size with massive resting buy limits or icebergs."),
        ("Footprint Signatures", "• Enormous volume node at bottom candle wick.\n• Heavy negative delta (-800 to -1,500 contracts) inside the bar, yet the candle closes positive or leaves a deep rejection wick.\n• Consecutive bids repeatedly replenished on the DOM."),
        ("CVD Confirmation", "CVD plunges aggressively to lower lows while price prints a higher low or equal double bottom (Bullish Absorption Divergence)."),
        ("Tactical Execution", "Enter LONG as trapped aggressive sellers are forced to buy to cover, igniting an explosive short squeeze back toward POC.")
    ]
    for head, text in abs_sections:
        pt = tf_abs.add_paragraph()
        pt.text = head
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(10)
        pd = tf_abs.add_paragraph()
        pd.text = text
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(3)

    # Panel 2: Exhaustion
    create_card(slide6, Inches(0.8) + comp_w + Inches(0.29), comp_top, comp_w, comp_h)
    tb_exh = slide6.shapes.add_textbox(Inches(1.1) + comp_w + Inches(0.29), comp_top + Inches(0.3), comp_w - Inches(0.6), comp_h - Inches(0.6))
    tf_exh = tb_exh.text_frame
    tf_exh.word_wrap = True
    tf_exh.margin_left = tf_exh.margin_right = tf_exh.margin_top = tf_exh.margin_bottom = 0

    p = tf_exh.paragraphs[0]
    p.text = "EXHAUSTION (AGGRESSIVE BUYER DEPLETION)"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_RED

    exh_sections = [
        ("Microstructure Reality", "The trend does NOT hit an active institutional wall; rather, aggressive participants simply run out of fuel. Buyers lose interest and refuse to lift the ask at higher prices."),
        ("Footprint Signatures", "• Very low volume prints at the upper extreme (e.g. 4 x 0 contracts at high of day).\n• Low Volume Node (LVN) at bar extreme with rapidly falling delta.\n• Zero prints / exhaustion tails showing lack of bid support."),
        ("CVD Confirmation", "Price drifts to a new marginal high, but CVD slopes downward or fails to break its previous high (Bearish Exhaustion Divergence)."),
        ("Tactical Execution", "Fade the failed probe; enter SHORT for a rotational mean-reversion back to the session Value Area High (VAH) or POC.")
    ]
    for head, text in exh_sections:
        pt = tf_exh.add_paragraph()
        pt.text = head
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(10)
        pd = tf_exh.add_paragraph()
        pd.text = text
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(3)

    # ==========================================
    # SLIDE 7: CVD STRATEGY & THE DELTA TRAP
    # ==========================================
    slide7 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide7)
    add_header(slide7, "Cumulative Volume Delta (CVD): Strategy & Traps", "Volume Delta Diagnostics & Multi-Session Divergence Tracking", 7)

    cvd_col_w = Inches(3.72)
    cvd_col_h = Inches(5.6)
    cvd_top = Inches(1.5)

    # Card 1: CVD Regimes
    create_card(slide7, Inches(0.8), cvd_top, cvd_col_w, cvd_col_h)
    tb_c1 = slide7.shapes.add_textbox(Inches(1.05), cvd_top + Inches(0.3), cvd_col_w - Inches(0.5), cvd_col_h - Inches(0.6))
    tf_c1 = tb_c1.text_frame
    tf_c1.word_wrap = True
    tf_c1.margin_left = tf_c1.margin_right = tf_c1.margin_top = tf_c1.margin_bottom = 0

    p = tf_c1.paragraphs[0]
    p.text = "CVD TREND REGIMES"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    c1_content = [
        ("Harmonic Trend", "Price making Higher Highs + CVD making Higher Highs. Represents genuine institutional buying participation. Rule: Never counter-trend fade!"),
        ("Absorption Divergence", "Price prints Lower Lows while CVD prints Higher Lows. Aggressive sellers are selling in panic, but passive limit buyers are absorbing every contract."),
        ("Exhaustion Divergence", "Price pushes to a new High of Day, but CVD prints a Lower High. Aggressive buyers have exhausted their capital; market is ripe for a sharp rotation.")
    ]
    for t, d in c1_content:
        pt = tf_c1.add_paragraph()
        pt.text = f"• {t}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(14)
        pd = tf_c1.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(4)

    # Card 2: Session Anchoring
    create_card(slide7, Inches(0.8) + cvd_col_w + Inches(0.28), cvd_top, cvd_col_w, cvd_col_h)
    tb_c2 = slide7.shapes.add_textbox(Inches(1.05) + cvd_col_w + Inches(0.28), cvd_top + Inches(0.3), cvd_col_w - Inches(0.5), cvd_col_h - Inches(0.6))
    tf_c2 = tb_c2.text_frame
    tf_c2.word_wrap = True
    tf_c2.margin_left = tf_c2.margin_right = tf_c2.margin_top = tf_c2.margin_bottom = 0

    p = tf_c2.paragraphs[0]
    p.text = "SESSION ANCHORING"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    c2_content = [
        ("The Overnight Distortion", "Globex session (Asia/Europe) runs on thin volume. Heavy hedging by European desks can skew raw CVD into millions of negative/positive contracts."),
        ("Anchor at 09:30 AM EST", "Always anchor a secondary CVD line strictly at the US Cash Market Open (09:30 AM EST). This isolates fresh US equity institutional order flow."),
        ("Multi-Anchor Strategy", "Compare Globex-anchored CVD vs RTH-anchored CVD to determine whether overnight inventory is being accommodated or liquidated.")
    ]
    for t, d in c2_content:
        pt = tf_c2.add_paragraph()
        pt.text = f"• {t}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(14)
        pd = tf_c2.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(4)

    # Card 3: The NQ Delta Trap
    create_card(slide7, Inches(0.8) + (cvd_col_w + Inches(0.28))*2, cvd_top, cvd_col_w, cvd_col_h)
    tb_c3 = slide7.shapes.add_textbox(Inches(1.05) + (cvd_col_w + Inches(0.28))*2, cvd_top + Inches(0.3), cvd_col_w - Inches(0.5), cvd_col_h - Inches(0.6))
    tf_c3 = tb_c3.text_frame
    tf_c3.word_wrap = True
    tf_c3.margin_left = tf_c3.margin_right = tf_c3.margin_top = tf_c3.margin_bottom = 0

    p = tf_c3.paragraphs[0]
    p.text = "THE DANGEROUS 'DELTA TRAP'"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_RED

    c3_content = [
        ("Negative Delta Grinds", "In NQ, market makers hedging 0DTE options gamma often buy index cash baskets while shorting futures passively. Price rallies 200 pts while CVD is deep negative!"),
        ("The Trap Explained", "Novice traders see negative delta, assume 'sellers are in control', and short into a relentless gamma squeeze, suffering blown accounts."),
        ("The Golden Invariant", "NEVER enter a trade solely on CVD divergence without price structure validation (Value Area breach, footprint absorption wick, stacked imbalance).")
    ]
    for t, d in c3_content:
        pt = tf_c3.add_paragraph()
        pt.text = f"• {t}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(14)
        pd = tf_c3.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(4)

    # ==========================================
    # SLIDE 8: NQ ORDER BOOK PHENOMENA
    # ==========================================
    slide8 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide8)
    add_header(slide8, "NQ Order Book Phenomena: Algos, Icebergs & Sweeps", "Institutional Execution Tactics & High-Frequency Behaviors", 8)

    ob_col_w = Inches(3.72)
    ob_col_h = Inches(5.6)
    ob_top = Inches(1.5)

    # 1. Iceberg Orders
    create_card(slide8, Inches(0.8), ob_top, ob_col_w, ob_col_h)
    tb_ob1 = slide8.shapes.add_textbox(Inches(1.05), ob_top + Inches(0.3), ob_col_w - Inches(0.5), ob_col_h - Inches(0.6))
    tf_ob1 = tb_ob1.text_frame
    tf_ob1.word_wrap = True
    tf_ob1.margin_left = tf_ob1.margin_right = tf_ob1.margin_top = tf_ob1.margin_bottom = 0

    p = tf_ob1.paragraphs[0]
    p.text = "ICEBERG ORDERS"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    ob1_points = [
        ("Native CME Icebergs", "Institutions hiding 300+ contract orders display only 5-10 visible contracts on the DOM. As soon as the display fills, CME instantly reloads another 5-10."),
        ("Detection Footprint", "If Time & Sales prints 450 contracts at 19,820.00, but DOM resting size never exceeded 12 contracts, an institutional iceberg absorbed the market."),
        ("Tactical Action", "When price tests an iceberg and fails to push through after 2 attempts, lean against the iceberg with a tight 2-tick stop behind it.")
    ]
    for t, d in ob1_points:
        pt = tf_ob1.add_paragraph()
        pt.text = f"• {t}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(14)
        pd = tf_ob1.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(4)

    # 2. Spoofing & Pulling
    create_card(slide8, Inches(0.8) + ob_col_w + Inches(0.28), ob_top, ob_col_w, ob_col_h)
    tb_ob2 = slide8.shapes.add_textbox(Inches(1.05) + ob_col_w + Inches(0.28), ob_top + Inches(0.3), ob_col_w - Inches(0.5), ob_col_h - Inches(0.6))
    tf_ob2 = tb_ob2.text_frame
    tf_ob2.word_wrap = True
    tf_ob2.margin_left = tf_ob2.margin_right = tf_ob2.margin_top = tf_ob2.margin_bottom = 0

    p = tf_ob2.paragraphs[0]
    p.text = "SPOOFING & PULL/STACK"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    ob2_points = [
        ("The 'Phantom Wall'", "HFT algorithms place 150-lot bids 4 ticks below market to trick retail algos into buying. As price gets within 1 tick, the bid evaporates instantly."),
        ("The Liquidity Acid Test", "Real institutional orders hold their ground and absorb volume when price arrives. Fake liquidity vanishes milliseconds before execution."),
        ("Speed Metrics", "CME MBO feed reveals order cancellations. A high cancellation-to-fill ratio (>85%) at a level confirms algorithmic spoofing.")
    ]
    for t, d in ob2_points:
        pt = tf_ob2.add_paragraph()
        pt.text = f"• {t}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(14)
        pd = tf_ob2.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(4)

    # 3. Liquidity Sweeps
    create_card(slide8, Inches(0.8) + (ob_col_w + Inches(0.28))*2, ob_top, ob_col_w, ob_col_h)
    tb_ob3 = slide8.shapes.add_textbox(Inches(1.05) + (ob_col_w + Inches(0.28))*2, ob_top + Inches(0.3), ob_col_w - Inches(0.5), ob_col_h - Inches(0.6))
    tf_ob3 = tb_ob3.text_frame
    tf_ob3.word_wrap = True
    tf_ob3.margin_left = tf_ob3.margin_right = tf_ob3.margin_top = tf_ob3.margin_bottom = 0

    p = tf_ob3.paragraphs[0]
    p.text = "LIQUIDITY SWEEPS & STOPS"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE

    ob3_points = [
        ("Engineering Counter-Liquidity", "Institutions cannot enter 1,000 contracts without moving the market against themselves. They intentionally push price beyond key highs to trigger stops."),
        ("The Stop-Run Cascade", "Buy-stops resting above Previous Day High (PDH) become market buy orders when hit. Institutions use these market buys to fill their large short orders."),
        ("NQ Stop Buffer", "In NQ, stop-runs routinely extend 8 to 20 points past obvious swing highs/lows before snapping back. Never place stops at exact level boundaries.")
    ]
    for t, d in ob3_points:
        pt = tf_ob3.add_paragraph()
        pt.text = f"• {t}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(14)
        pd = tf_ob3.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(4)

    # ==========================================
    # SLIDE 9: TACTICAL PLAYBOOK 1: SWEEP & ABSORPTION
    # ==========================================
    slide9 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide9)
    add_header(slide9, "Tactical Playbook 1: The Liquidity Sweep & Absorption Reversal", "High-Probability Reversal Model at Structural Extremes", 9)

    step_w = Inches(2.76)
    step_h = Inches(5.6)
    step_gap = Inches(0.23)
    step_top = Inches(1.5)

    pb1_steps = [
        ("PHASE 1", "LEVEL CONTEXT", ACCENT_CYAN, [
            ("Identify Liquidity Pool", "Mark Previous Day High (PDH), Overnight High (ONH), or Virgin POC."),
            ("Session Framing", "Price is trading at or above Value Area High (VAH) in an extended condition."),
            ("Watch Depth", "Monitor DOM for iceberg bids/asks holding resting size as price approaches.")
        ]),
        ("PHASE 2", "THE SWEEP & BAIT", ACCENT_AMBER, [
            ("The Stop Run", "Price pierces 5 to 15 points beyond the key swing level."),
            ("Retail Trap", "Breakout traders enter long via market orders; short stops trigger into market buys."),
            ("Volume Surge", "Time & Sales shows massive aggressive buy prints hitting the Ask.")
        ]),
        ("PHASE 3", "ABSORPTION PRINT", ACCENT_RED, [
            ("Footprint Cluster", "Massive positive delta (+700 to +1,200) prints at top 3 ticks, but price stops advancing."),
            ("Wick Formation", "The candle fails to hold new highs and forms a clear rejection tail."),
            ("Delta Flip", "Aggressive sell imbalance prints immediately as price drops back below the level.")
        ]),
        ("PHASE 4", "EXECUTION & RISK", ACCENT_GREEN, [
            ("Entry Trigger", "Short on market or limit at the retest of the broken level or stacked sell imbalance."),
            ("Stop Loss", "Strictly 2-3 ticks above the sweep high wick (Risk: 8-14 NQ points)."),
            ("Profit Targets", "Target 1: Session POC.\nTarget 2: Value Area Low (VAL) or Opposite Overnight Low.")
        ])
    ]

    for idx, (stage, s_title, col, bullets) in enumerate(pb1_steps):
        s_left = Inches(0.8) + idx * (step_w + step_gap)
        create_card(slide9, s_left, step_top, step_w, step_h)
        
        # Pill header
        bar = slide9.shapes.add_shape(MSO_SHAPE.RECTANGLE, s_left + Inches(0.25), step_top + Inches(0.25), Inches(0.5), Inches(0.04))
        bar.fill.solid()
        bar.fill.fore_color.rgb = col
        bar.line.fill.background()

        tb = slide9.shapes.add_textbox(s_left + Inches(0.25), step_top + Inches(0.45), step_w - Inches(0.5), step_h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        
        p = tf.paragraphs[0]
        p.text = stage
        p.font.name = FONT_CODE
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = col
        
        p_t = tf.add_paragraph()
        p_t.text = s_title
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(4)
        
        for k, v in bullets:
            pb = tf.add_paragraph()
            pb.text = f"• {k}"
            pb.font.name = FONT_HEADING
            pb.font.size = Pt(11)
            pb.font.bold = True
            pb.font.color.rgb = TEXT_LIGHT_GRAY
            pb.space_before = Pt(12)
            
            pbd = tf.add_paragraph()
            pbd.text = v
            pbd.font.name = FONT_BODY
            pbd.font.size = Pt(10)
            pbd.font.color.rgb = TEXT_MUTED
            pbd.space_before = Pt(2)

    # ==========================================
    # SLIDE 10: TACTICAL PLAYBOOK 2: STACKED IMBALANCE RETEST
    # ==========================================
    slide10 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide10)
    add_header(slide10, "Tactical Playbook 2: Stacked Imbalance Retest", "Institutional Momentum Continuation Model in Trend Regimes", 10)

    pb2_steps = [
        ("PHASE 1", "INITIATIVE DRIVE", ACCENT_CYAN, [
            ("Session Catalyst", "Market opens with an aggressive Opening Drive or breaks out of Initial Balance."),
            ("Sweeping Velocity", "Large institutional participant lifts multiple price levels without pause."),
            ("Volume Expansion", "Volume is 1.5x - 2.5x higher than the 20-period moving average.")
        ]),
        ("PHASE 2", "IMBALANCE CLUSTER", ACCENT_GREEN, [
            ("Footprint Verification", "Identify 3 or more consecutive green buy imbalances (>350% Ask/Bid ratio)."),
            ("Mark the Zone", "Draw a horizontal box covering the exact price span of the stacked imbalances."),
            ("Institutional Shelf", "This zone represents committed institutional capital defending their average fill.")
        ]),
        ("PHASE 3", "LOW-VOLUME RETEST", ACCENT_AMBER, [
            ("Pullback Signature", "Price pulls back to retest the top of the stacked imbalance zone."),
            ("Volume Evaporation", "Crucial: The pullback must occur on low volume and declining negative delta."),
            ("No Sell Imbalances", "If heavy aggressive selling prints into the zone, the setup is invalidated.")
        ]),
        ("PHASE 4", "ENTRY & EXTENSION", ACCENT_PURPLE, [
            ("Execution Trigger", "Enter LONG upon first positive delta flip or aggressive bid absorption at the shelf."),
            ("Stop Loss Placement", "Strictly 1-2 ticks below the lowest tick of the stacked imbalance block."),
            ("Profit Target", "Next liquidity pool (Unfinished Auction, Session High, or 2R/3R extension).")
        ])
    ]

    for idx, (stage, s_title, col, bullets) in enumerate(pb2_steps):
        s_left = Inches(0.8) + idx * (step_w + step_gap)
        create_card(slide10, s_left, step_top, step_w, step_h)
        
        # Pill header
        bar = slide10.shapes.add_shape(MSO_SHAPE.RECTANGLE, s_left + Inches(0.25), step_top + Inches(0.25), Inches(0.5), Inches(0.04))
        bar.fill.solid()
        bar.fill.fore_color.rgb = col
        bar.line.fill.background()

        tb = slide10.shapes.add_textbox(s_left + Inches(0.25), step_top + Inches(0.45), step_w - Inches(0.5), step_h - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        
        p = tf.paragraphs[0]
        p.text = stage
        p.font.name = FONT_CODE
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = col
        
        p_t = tf.add_paragraph()
        p_t.text = s_title
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(13)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(4)
        
        for k, v in bullets:
            pb = tf.add_paragraph()
            pb.text = f"• {k}"
            pb.font.name = FONT_HEADING
            pb.font.size = Pt(11)
            pb.font.bold = True
            pb.font.color.rgb = TEXT_LIGHT_GRAY
            pb.space_before = Pt(12)
            
            pbd = tf.add_paragraph()
            pbd.text = v
            pbd.font.name = FONT_BODY
            pbd.font.size = Pt(10)
            pbd.font.color.rgb = TEXT_MUTED
            pbd.space_before = Pt(2)

    # ==========================================
    # SLIDE 11: TIME-OF-DAY MICROSTRUCTURE
    # ==========================================
    slide11 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide11)
    add_header(slide11, "Time-of-Day Microstructure: The NQ Clock", "Volatility Regimes & Institutional Execution Schedules (EST)", 11)

    time_w = Inches(11.733)
    row_h = Inches(0.98)
    row_gap = Inches(0.16)
    time_top = Inches(1.5)

    time_blocks = [
        ("08:30 AM EST", "MACRO CATALYST WINDOW", ACCENT_RED,
         "CPI, PPI, Non-Farm Payrolls, Retail Sales releases. Depth of market collapses to 2-5 contracts per tick; bid/ask spread widens up to 6 ticks. Pure algorithmic whipsaws. Strict desk rule: Flat book or wide execution envelopes."),

        ("09:30 - 10:00 AM EST", "US CASH OPEN (OPENING DRIVE)", ACCENT_CYAN,
         "Massive liquidity injection from NYSE/Nasdaq cash open. Highest order flow volume and fastest pace of the day. Determines whether the session is an 'Initiative Trend Day' or an 'Open-Auction Mean Reversion' day."),

        ("10:00 - 11:30 AM EST", "PRIME TACTICAL WINDOW", ACCENT_GREEN,
         "The cleanest order flow environment. Initial balance is established. Institutional VWAP algorithms execute client orders. Highest win rate for Liquidity Sweep Reversals and Stacked Imbalance Retests."),

        ("11:30 AM - 01:30 PM EST", "MIDDAY CHOP & EUROPEAN CLOSE", ACCENT_AMBER,
         "London market closes at 11:30 AM EST. Order flow volume drops by 60%. Algorithms run mean-reverting tight ranges. Dangerous trap for breakout traders. Focus strictly on Value Area boundaries or step away."),

        ("03:00 - 04:00 PM EST", "THE CLOSING POWER HOUR & MOC", ACCENT_PURPLE,
         "Market-On-Close (MOC) imbalance orders submitted by mutual funds and ETFs at 03:50 PM. Heavy portfolio rebalancing causes violent directional trending or aggressive gamma pin squeezes into the 4:00 PM bell.")
    ]

    for i, (time_lbl, regime, col, desc) in enumerate(time_blocks):
        y_pos = time_top + i * (row_h + row_gap)
        create_card(slide11, Inches(0.8), y_pos, time_w, row_h)
        
        # Left accent pill
        p_pill = slide11.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), y_pos, Inches(0.08), row_h)
        p_pill.fill.solid()
        p_pill.fill.fore_color.rgb = col
        p_pill.line.fill.background()

        tb = slide11.shapes.add_textbox(Inches(1.1), y_pos + Inches(0.12), time_w - Inches(0.5), row_h - Inches(0.24))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        
        p = tf.paragraphs[0]
        r1 = p.add_run()
        r1.text = time_lbl + "  "
        r1.font.name = FONT_CODE
        r1.font.size = Pt(11)
        r1.font.bold = True
        r1.font.color.rgb = col
        
        r2 = p.add_run()
        r2.text = f"|  {regime}"
        r2.font.name = FONT_HEADING
        r2.font.size = Pt(11.5)
        r2.font.bold = True
        r2.font.color.rgb = TEXT_WHITE
        
        p_desc = tf.add_paragraph()
        p_desc.text = desc
        p_desc.font.name = FONT_BODY
        p_desc.font.size = Pt(10)
        p_desc.font.color.rgb = TEXT_MUTED
        p_desc.space_before = Pt(4)

    # ==========================================
    # SLIDE 12: EXECUTION, RISK & CHECKLIST
    # ==========================================
    slide12 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(slide12)
    add_header(slide12, "Execution Infrastructure, Risk & Daily Checklist", "Professional Risk Protocols & Pre-Market Routine", 12)

    fin_w = Inches(3.72)
    fin_h = Inches(5.6)
    fin_top = Inches(1.5)

    # Col 1: Infrastructure
    create_card(slide12, Inches(0.8), fin_top, fin_w, fin_h)
    tb_f1 = slide12.shapes.add_textbox(Inches(1.05), fin_top + Inches(0.3), fin_w - Inches(0.5), fin_h - Inches(0.6))
    tf_f1 = tb_f1.text_frame
    tf_f1.word_wrap = True
    tf_f1.margin_left = tf_f1.margin_right = tf_f1.margin_top = tf_f1.margin_bottom = 0

    p = tf_f1.paragraphs[0]
    p.text = "EXECUTION INFRASTRUCTURE"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    f1_points = [
        ("Direct CME MBO Feed", "Must use unthrottled Level 2 Market By Order feed (Rithmic, CQG, TT). Retail CFD brokers or aggregated feeds hide true queue depth."),
        ("Platform Selection", "Sierra Chart (Package 11/12), ATAS, NinjaTrader 8 with Order Flow Suite, or Bookmap for heatmap liquidity visualization."),
        ("Gateway Latency", "Sub-20ms ping to CME Aurora data center. In NQ, high execution latency results in severe slippage on market orders.")
    ]
    for t, d in f1_points:
        pt = tf_f1.add_paragraph()
        pt.text = f"• {t}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(14)
        pd = tf_f1.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(4)

    # Col 2: Risk Management Rules
    create_card(slide12, Inches(0.8) + fin_w + Inches(0.28), fin_top, fin_w, fin_h)
    tb_f2 = slide12.shapes.add_textbox(Inches(1.05) + fin_w + Inches(0.28), fin_top + Inches(0.3), fin_w - Inches(0.5), fin_h - Inches(0.6))
    tf_f2 = tb_f2.text_frame
    tf_f2.word_wrap = True
    tf_f2.margin_left = tf_f2.margin_right = tf_f2.margin_top = tf_f2.margin_bottom = 0

    p = tf_f2.paragraphs[0]
    p.text = "NQ RISK MANAGEMENT LAWS"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_RED

    f2_points = [
        ("Dollar Volatility Sizing", "NQ is $20 / point ($5 / tick). A normal 20-point stop = $400 / contract. If volatility index (VXN) > 25, transition to Micro (MNQ, $2 / pt) to keep risk constant."),
        ("Order Flow Stops", "Never place arbitrary 15 or 20 point stops. Place stops strictly 2 ticks behind confirmed absorption nodes or stacked imbalance shelves."),
        ("Max Daily Loss Limit", "Hard software lock: 3 consecutive losses or 2.5% account drawdown shuts down trading for the day. Protect psychological capital.")
    ]
    for t, d in f2_points:
        pt = tf_f2.add_paragraph()
        pt.text = f"• {t}"
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(12)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(14)
        pd = tf_f2.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10.5)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(4)

    # Col 3: The Daily 5-Point Checklist
    create_card(slide12, Inches(0.8) + (fin_w + Inches(0.28))*2, fin_top, fin_w, fin_h)
    tb_f3 = slide12.shapes.add_textbox(Inches(1.05) + (fin_w + Inches(0.28))*2, fin_top + Inches(0.3), fin_w - Inches(0.5), fin_h - Inches(0.6))
    tf_f3 = tb_f3.text_frame
    tf_f3.word_wrap = True
    tf_f3.margin_left = tf_f3.margin_right = tf_f3.margin_top = tf_f3.margin_bottom = 0

    p = tf_f3.paragraphs[0]
    p.text = "THE DAILY 5-POINT CHECKLIST"
    p.font.name = FONT_CODE
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN

    f3_points = [
        ("[ 1 ] Map Key Macro Levels", "Mark Prior Day High/Low (PDH/PDL), Overnight High/Low (ONH/ONL), and Prior Session POC."),
        ("[ 2 ] Scan Unfinished Auctions", "Audit previous 3 sessions for virgin POCs (vPOCs) and unclosed auction extremes."),
        ("[ 3 ] Check Catalyst Calendar", "Confirm timing of 08:30 AM EST and 10:00 AM EST data releases and Fed speaker schedules."),
        ("[ 4 ] Anchor CVD at 09:30 AM", "Establish baseline delta from the opening bell to detect early institutional divergence."),
        ("[ 5 ] Require Footprint Validation", "Never enter without confirmed stacked imbalance or absorption exhaustion at key levels.")
    ]
    for t, d in f3_points:
        pt = tf_f3.add_paragraph()
        pt.text = t
        pt.font.name = FONT_HEADING
        pt.font.size = Pt(11.5)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pt.space_before = Pt(11)
        pd = tf_f3.add_paragraph()
        pd.text = d
        pd.font.name = FONT_BODY
        pd.font.size = Pt(10)
        pd.font.color.rgb = TEXT_MUTED
        pd.space_before = Pt(2)

    # Save Presentation
    output_dir = r"E:\PROJECTS\Trading Bot\trading_bot - Devolopment - Interface"
    output_path = os.path.join(output_dir, "NQ_Order_Flow_Mastery.pptx")
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")
    print(f"Total slides generated: {len(prs.slides)}")

if __name__ == "__main__":
    build_presentation()
