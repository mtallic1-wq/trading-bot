"""
The Edge Room — Discord Server Auto-Setup Script v2
=====================================================
Run this ONCE to auto-build all channels, categories, roles,
post starter messages, and print bot invite links.
"""

import asyncio
import discord
from discord.ext import commands

# ============================================================
# CONFIGURATION — Fill these in before running
# ============================================================
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"   # Paste your bot token here (never commit real tokens!)
GUILD_ID  = 0                        # Right-click your server icon → Copy Server ID

OWNER_NAME = "The Operator"
WEBSITE    = "https://nqbiasengine.qzz.io"
PREMIUM_LINK = "https://nqbiasengine.lemonsqueezy.com/checkout/buy/05daaba5-3c34-450e-bd1e-34bef59c6981"

# ============================================================
# RECOMMENDED BOTS (printed at the end — you invite manually)
# ============================================================
RECOMMENDED_BOTS = [
    {
        "name": "Carl-bot",
        "purpose": "Auto-mod, reaction roles, welcome messages, logging, custom commands",
        "invite": "https://carl.gg/",
        "setup_tip": "After inviting: Set up reaction roles in #welcome-and-rules so new users self-assign 'Member' role."
    },
    {
        "name": "MEE6",
        "purpose": "Leveling system, auto-moderation, announcements, timed messages",
        "invite": "https://mee6.xyz/add",
        "setup_tip": "Enable Levels plugin so active traders rank up. Set auto-mod to delete spam/links in public channels."
    },
    {
        "name": "Dyno",
        "purpose": "Advanced auto-mod, anti-spam, anti-raid, server logs",
        "invite": "https://dyno.gg/invite",
        "setup_tip": "Enable auto-mod to ban spammers, filter bad words, and log all moderation actions to #server-logs."
    },
    {
        "name": "Statbot",
        "purpose": "Server growth analytics — tracks member count, message volume, active channels",
        "invite": "https://statbot.net/invite",
        "setup_tip": "Great for tracking server growth as you promote The Edge Room."
    },
    {
        "name": "Sesh",
        "purpose": "Event scheduling — schedule pre-market sessions, trading Q&As, voice chats",
        "invite": "https://sesh.fyi/invite",
        "setup_tip": "Use in #economic-calendar to post timed event reminders for high-impact news events."
    },
    {
        "name": "Arcane",
        "purpose": "Auto-role on join, anti-bot verification, welcome DM messages",
        "invite": "https://arcane.bot/invite",
        "setup_tip": "Set auto-role to assign 'Member' role when someone joins. Enable anti-bot captcha verification."
    },
]

# ============================================================
# ROLES
# ============================================================
ROLES = [
    # (name, color_hex, hoist, mentionable)
    ("💎 Premium",        0x10b981, True,  False),
    ("📊 Active Trader",  0x8b5cf6, True,  False),
    ("🤖 EdgeBot",        0x06b6d4, False, False),
    ("🛡️ Moderator",     0x3b82f6, True,  False),
    ("👋 Member",         0x6b7280, False, False),
]

# ============================================================
# CATEGORIES AND CHANNELS
# ============================================================
CATEGORIES_AND_CHANNELS = [
    {
        "name": "📢 INFORMATION",
        "channels": [
            {"name": "📌・welcome-and-rules",   "type": "text"},
            {"name": "📣・announcements",        "type": "text"},
            {"name": "🗺️・server-guide",        "type": "text"},
            {"name": "🔗・useful-links",         "type": "text"},
        ]
    },
    {
        "name": "📊 DAILY MARKET INTEL",
        "channels": [
            {"name": "🌅・pre-market-bias",      "type": "text"},
            {"name": "📰・market-news",           "type": "text"},
            {"name": "📅・economic-calendar",     "type": "text"},
            {"name": "📈・post-market-recap",     "type": "text"},
        ]
    },
    {
        "name": "💬 COMMUNITY",
        "channels": [
            {"name": "💬・general-chat",          "type": "text"},
            {"name": "🧠・trading-discussion",    "type": "text"},
            {"name": "📷・trade-screenshots",     "type": "text"},
            {"name": "🏆・wins-and-losses",       "type": "text"},
            {"name": "🙋・questions-and-help",    "type": "text"},
        ]
    },
    {
        "name": "🤖 EDGEBOT",
        "channels": [
            {"name": "🤖・edgebot-commands",      "type": "text"},
            {"name": "📋・edgebot-results",       "type": "text"},
            {"name": "📡・edgebot-alerts",        "type": "text"},
        ]
    },
    {
        "name": "🛠️ TOOLS & RESOURCES",
        "channels": [
            {"name": "🌐・nq-bias-engine",        "type": "text"},
            {"name": "📚・volume-profile-edu",    "type": "text"},
            {"name": "📖・strategy-library",      "type": "text"},
            {"name": "🔧・tool-updates",          "type": "text"},
        ]
    },
    {
        "name": "💎 PREMIUM MEMBERS ONLY",
        "channels": [
            {"name": "👑・premium-chat",           "type": "text",  "premium_only": True},
            {"name": "📬・premium-alerts",         "type": "text",  "premium_only": True},
            {"name": "🎯・premium-setups",         "type": "text",  "premium_only": True},
        ]
    },
    {
        "name": "🔊 VOICE ROOMS",
        "channels": [
            {"name": "🌅 Pre-Market Prep",         "type": "voice"},
            {"name": "🔊 General Lounge",          "type": "voice"},
            {"name": "📚 Study Hall",              "type": "voice"},
        ]
    },
    {
        "name": "🔧 STAFF ONLY",
        "channels": [
            {"name": "🔨・mod-chat",               "type": "text",  "staff_only": True},
            {"name": "📝・server-logs",            "type": "text",  "staff_only": True},
            {"name": "🤖・bot-commands",           "type": "text",  "staff_only": True},
        ]
    },
]

# ============================================================
# STARTER MESSAGES
# ============================================================
WELCOME_MESSAGE = f"""
👋 **Welcome to The Edge Room!**

We are a community of professional Nasdaq futures traders using data-driven, volume-profile based tools built by **{OWNER_NAME}**.

━━━━━━━━━━━━━━━━━━━━━━━

🌐 **NQ Bias Engine** — Free Pre-Market Dashboard
Get daily NQ bias predictions, volume profile playbook strategies, and multi-timeframe swing levels before the NYSE open.
🔗 {WEBSITE}

🤖 **EdgeBot** — Discord Trading Bot
Real-time alerts and market data directly inside this server.

━━━━━━━━━━━━━━━━━━━━━━━

📜 **Server Rules:**
**1.** Be respectful — traders of all levels welcome.
**2.** No spam or unsolicited self-promotion.
**3.** No financial advice. Share ideas, not calls.
**4.** Keep all channels on-topic.
**5.** No posting referral links without permission.

━━━━━━━━━━━━━━━━━━━━━━━

💎 **Want Premium Access?**
Unlock email delivery of daily pre-market analysis before the open.
👉 {PREMIUM_LINK}

React with ✅ below to get the **Member** role and access the community!
"""

USEFUL_LINKS_MESSAGE = f"""
🔗 **Useful Links — The Edge Room**

━━━━━━━━━━━━━━━━━━━━━━━

🌐 **NQ Bias Engine Dashboard** (Free)
{WEBSITE}

💎 **Upgrade to Premium**
{PREMIUM_LINK}

🐦 **Follow on X (Twitter)**
https://x.com/

📊 **TradingView Charts**
https://www.tradingview.com/

📅 **Economic Calendar**
https://www.forexfactory.com/calendar

📈 **CME Group — NQ Futures Specs**
https://www.cmegroup.com/markets/equities/nasdaq/e-mini-nasdaq-100.html

━━━━━━━━━━━━━━━━━━━━━━━
"""

STRATEGY_LIBRARY_MESSAGE = """
📖 **Strategy Library — Volume Profile Playbooks**

━━━━━━━━━━━━━━━━━━━━━━━

**🟦 R1 — Value Area Edge Fade**
> Win Rate: 60-70% | R:R: 1:1 – 1:1.5 | Stop: 10-15 pts
> **Setup:** Price pushes into VAL or VAH; wait for delta flip / absorption
> 🟢 Bull: Buy at VAL → target POC → VAH
> 🔴 Bear: Sell at VAH → target POC → VAL
> ⚠️ Kill Switch: 15+ min of volume building OUTSIDE the edge

━━━━━━━━━━━━━━━━━━━━━━━

**🟦 R2 — The 80% Rule**
> Win Rate: 70-80% | R:R: 1:1.5 – 1:3 | Stop: 15 pts
> **Setup:** Open outside yesterday's value; price pulls back in and accepts 15-20 min
> 🟢 Bull: Buy VAL retest from above — CVD divergence required
> 🔴 Bear: Sell VAH retest from below — CVD divergence required
> ⚠️ Kill Switch: Price drops back out of value (fake acceptance)

━━━━━━━━━━━━━━━━━━━━━━━

**🟦 MY-R — Big Balance Extreme Fade**
> Win Rate: Track own data | R:R: 1:2 – 1:4 | Stop: 15-25 pts
> **Setup:** Price reaches composite VAH or VAL of multi-day balance
> 🟢 Bull: Buy at composite VAL — needs absorption + CVD divergence
> 🔴 Bear: Sell at composite VAH — needs absorption + CVD divergence
> ⚠️ Kill Switch: Price accepts beyond big range edge (15+ min volume)

━━━━━━━━━━━━━━━━━━━━━━━
⚡ *Live playbook selection is automated daily at nqbiasengine.qzz.io*
"""

# ============================================================
# BOT RUN
# ============================================================
intents = discord.Intents.default()
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"\n✅ Logged in as {bot.user}")
    guild = bot.get_guild(GUILD_ID)

    if not guild:
        print("❌ ERROR: Guild not found. Check GUILD_ID and make sure bot is in the server.")
        await bot.close()
        return

    print(f"🔨 Setting up: {guild.name}\n")

    # -- Create Roles --
    print("📋 Creating roles...")
    premium_role = None
    mod_role     = None
    everyone     = guild.default_role
    existing_names = [r.name for r in guild.roles]

    for role_name, color_hex, hoist, mentionable in ROLES:
        if role_name not in existing_names:
            role = await guild.create_role(
                name=role_name,
                color=discord.Color(color_hex),
                hoist=hoist,
                mentionable=mentionable
            )
            print(f"  ✅ Created role: {role_name}")
        else:
            role = discord.utils.get(guild.roles, name=role_name)
            print(f"  ⏭️  Exists: {role_name}")

        if "Premium" in role_name:  premium_role = role
        if "Moderator" in role_name: mod_role = role

    await asyncio.sleep(1)

    # -- Remove ALL existing channels and categories --
    print("\n🗑️  Wiping all existing channels and categories...")
    
    # Delete all channels first (must delete channels before categories)
    for channel in guild.channels:
        if not isinstance(channel, discord.CategoryChannel):
            try:
                await channel.delete()
                print(f"  🗑️  Deleted channel: #{channel.name}")
                await asyncio.sleep(0.3)
            except discord.Forbidden:
                print(f"  ❌ No permission to delete: #{channel.name}")
            except Exception as e:
                print(f"  ⚠️  Skipped: #{channel.name} ({e})")

    # Delete all categories
    for channel in guild.channels:
        if isinstance(channel, discord.CategoryChannel):
            try:
                await channel.delete()
                print(f"  🗑️  Deleted category: {channel.name}")
                await asyncio.sleep(0.3)
            except discord.Forbidden:
                print(f"  ❌ No permission to delete category: {channel.name}")
            except Exception as e:
                print(f"  ⚠️  Skipped category: {channel.name} ({e})")

    print("  ✅ All channels wiped. Building fresh...\n")
    await asyncio.sleep(2)

    # -- Create Categories & Channels --
    print("\n📁 Creating categories and channels...")
    channel_refs = {}

    for cat_data in CATEGORIES_AND_CHANNELS:
        cat_name = cat_data["name"]
        category = await guild.create_category(cat_name)
        print(f"\n  📁 {cat_name}")

        for ch_data in cat_data["channels"]:
            ch_name    = ch_data["name"]
            ch_type    = ch_data["type"]
            is_premium = ch_data.get("premium_only", False)
            is_staff   = ch_data.get("staff_only", False)
            overwrites = {}

            if is_premium and premium_role:
                overwrites[everyone]     = discord.PermissionOverwrite(view_channel=False)
                overwrites[premium_role] = discord.PermissionOverwrite(view_channel=True, send_messages=True)
                if mod_role:
                    overwrites[mod_role] = discord.PermissionOverwrite(view_channel=True, send_messages=True)

            if is_staff and mod_role:
                overwrites[everyone] = discord.PermissionOverwrite(view_channel=False)
                overwrites[mod_role] = discord.PermissionOverwrite(view_channel=True, send_messages=True)

            if ch_type == "text":
                channel = await guild.create_text_channel(ch_name, category=category, overwrites=overwrites)
            else:
                channel = await guild.create_voice_channel(ch_name, category=category, overwrites=overwrites)

            channel_refs[ch_name] = channel
            lock = " 🔒" if (is_premium or is_staff) else ""
            print(f"    ✅ #{ch_name}{lock}")
            await asyncio.sleep(0.4)

    # -- Post Starter Messages --
    print("\n📨 Posting starter messages...")

    welcome_ch = discord.utils.get(guild.text_channels, name="📌・welcome-and-rules")
    if welcome_ch:
        await welcome_ch.send(WELCOME_MESSAGE)
        print("  ✅ Posted welcome message")

    links_ch = discord.utils.get(guild.text_channels, name="🔗・useful-links")
    if links_ch:
        await links_ch.send(USEFUL_LINKS_MESSAGE)
        print("  ✅ Posted useful links")

    strategy_ch = discord.utils.get(guild.text_channels, name="📖・strategy-library")
    if strategy_ch:
        await strategy_ch.send(STRATEGY_LIBRARY_MESSAGE)
        print("  ✅ Posted strategy library")

    nq_ch = discord.utils.get(guild.text_channels, name="🌐・nq-bias-engine")
    if nq_ch:
        await nq_ch.send(
            f"🌐 **NQ Bias Engine — Live Dashboard**\n\n"
            f"Get the free daily pre-market Nasdaq bias prediction, volume profile playbook, and multi-timeframe swing levels before the NYSE open.\n\n"
            f"👉 **{WEBSITE}**\n\n"
            f"💎 Upgrade to Premium for email delivery before the bell:\n{PREMIUM_LINK}"
        )
        print("  ✅ Posted NQ Bias Engine link")

    await asyncio.sleep(1)

    # -- Print Bot Invite Links --
    print("\n" + "="*60)
    print("🤖 RECOMMENDED BOTS TO ADD MANUALLY:")
    print("="*60)
    for b in RECOMMENDED_BOTS:
        print(f"\n  🔹 {b['name']}")
        print(f"     Purpose : {b['purpose']}")
        print(f"     Invite  : {b['invite']}")
        print(f"     Tip     : {b['setup_tip']}")

    print("\n" + "="*60)
    print("🎉 THE EDGE ROOM IS READY!")
    print("="*60)
    print("\n📌 Final steps:")
    print("   1. Set server icon to your Operator logo")
    print("   2. Invite the bots listed above")
    print("   3. Set Carl-bot reaction role on ✅ in #welcome-and-rules → assigns Member role")
    print("   4. Set MEE6 auto-mod to block spam in public channels")
    print("   5. Pin the welcome message in #welcome-and-rules")
    print("   6. Remove this setup bot from the server\n")

    await bot.close()


bot.run(BOT_TOKEN)
