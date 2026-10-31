import type { StudioTemplate } from './types';

/**
 * Standard Studio Starter Files
 */
const HTML_STARTER = (title: string, content: string = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen">
  ${content || `<div id="app" class="p-8 text-center"><h1 class="text-3xl font-bold">${title}</h1><p class="mt-4 text-gray-600">Coming soon...</p></div>`}
</body>
</html>`;

export const CORE_TEMPLATES_PAYLOADS: Record<string, Record<string, string>> = {
  'ai-chat': {
    'index.html': HTML_STARTER('AI Chat', `
      <div class="max-w-2xl mx-auto mt-10 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div class="bg-blue-600 p-4 text-white font-bold flex items-center justify-between">
          <span>Sovereign Assistant</span>
          <div class="flex gap-2 text-xs opacity-80">
            <span>Online</span>
            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          </div>
        </div>
        <div id="chat-feed" class="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <div class="flex flex-col items-start gap-1">
            <div class="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none text-sm shadow-sm max-w-[80%]">
              Hello! How can I assist your engineering tasks today?
            </div>
            <span class="text-[10px] text-gray-400 ml-1">Assistant • 10:00 AM</span>
          </div>
        </div>
        <div class="p-4 border-t border-gray-200 bg-white">
          <div class="flex gap-2">
            <input type="text" placeholder="Type a message..." class="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500">
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Send</button>
          </div>
        </div>
      </div>
    `),
    'app.js': `// AI Chat App Logic\nconsole.log('AI Chat loaded');`,
    'styles.css': `/* AI Chat Styles */\n.chat-container { display: flex; }`
  },
  'coffee-shop': {
    'index.html': HTML_STARTER('Brew & Bean Coffee', `
      <nav class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div class="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div class="text-2xl font-black tracking-tighter text-amber-900">BREW & BEAN</div>
          <div class="hidden md:flex gap-8 text-sm font-bold text-amber-800">
            <a href="#" class="hover:text-amber-600">Menu</a>
            <a href="#" class="hover:text-amber-600">Our Story</a>
            <a href="#" class="hover:text-amber-600">Locations</a>
          </div>
          <button class="bg-amber-900 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-amber-800 transition-all">Order Online</button>
        </div>
      </nav>
      
      <section class="relative h-[80vh] flex items-center justify-center bg-amber-50">
        <div class="absolute inset-0 opacity-10" style="background-image: url('https://www.transparenttextures.com/patterns/coffee-beans.png');"></div>
        <div class="relative z-10 text-center max-w-3xl px-6">
          <span class="inline-block px-4 py-1.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-widest mb-6">Freshly Roasted Daily</span>
          <h1 class="text-6xl md:text-8xl font-black text-amber-950 leading-none mb-8">Better Beans,<br/>Better Mornings.</h1>
          <p class="text-lg text-amber-800 mb-10 leading-relaxed">Hand-crafted coffee from sustainable farms. Roasted in small batches to preserve the complex flavor profiles of every bean.</p>
          <div class="flex flex-wrap justify-center gap-4">
            <button class="bg-amber-900 text-white px-8 py-4 rounded-xl text-sm font-bold shadow-xl shadow-amber-900/20 hover:scale-105 transition-transform">Explore the Menu</button>
            <button class="bg-white text-amber-900 border border-amber-200 px-8 py-4 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors">Find a Location</button>
          </div>
        </div>
      </section>

      <section class="py-24 bg-white">
        <div class="max-w-6xl mx-auto px-6">
          <div class="flex justify-between items-end mb-16">
            <div>
              <h2 class="text-4xl font-black text-amber-950 mb-2">Today's Specials</h2>
              <p class="text-amber-700">Seasonal favorites selected by our baristas.</p>
            </div>
            <a href="#" class="text-amber-900 font-bold border-b-2 border-amber-900">View Full Menu</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="group cursor-pointer">
              <div class="aspect-square bg-amber-100 rounded-2xl overflow-hidden mb-6">
                <img src="https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=800&auto=format&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-xl font-bold text-amber-950">Vanilla Bean Latte</h3>
                  <p class="text-sm text-amber-600">Espresso, steamed milk, vanilla</p>
                </div>
                <span class="text-lg font-black text-amber-900">$5.50</span>
              </div>
            </div>
            <div class="group cursor-pointer">
              <div class="aspect-square bg-amber-100 rounded-2xl overflow-hidden mb-6">
                <img src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-xl font-bold text-amber-950">Cold Brew Nitro</h3>
                  <p class="text-sm text-amber-600">Slow-steeped, creamy head</p>
                </div>
                <span class="text-lg font-black text-amber-900">$4.95</span>
              </div>
            </div>
            <div class="group cursor-pointer">
              <div class="aspect-square bg-amber-100 rounded-2xl overflow-hidden mb-6">
                <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-xl font-bold text-amber-950">Matcha Green Tea</h3>
                  <p class="text-sm text-amber-600">Ceremonial grade, lightly sweetened</p>
                </div>
                <span class="text-lg font-black text-amber-900">$6.25</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `),
    'menu.json': JSON.stringify([
      { name: 'Espresso', price: 3.50, category: 'Hot' },
      { name: 'Latte', price: 4.75, category: 'Hot' },
      { name: 'Cold Brew', price: 4.50, category: 'Cold' }
    ], null, 2)
  },
  'bakery': {
    'index.html': HTML_STARTER('Golden Crust Bakery', `
      <div class="bg-orange-50 min-h-screen">
        <header class="p-6 text-center border-b border-orange-100 bg-white">
          <h1 class="text-4xl font-serif font-black text-orange-950 tracking-tight">GOLDEN CRUST</h1>
          <p class="text-orange-800 text-sm italic mt-1">Baked with Love Since 1992</p>
        </header>
        <main class="max-w-4xl mx-auto py-12 px-6">
          <div class="bg-white rounded-3xl p-8 shadow-xl shadow-orange-950/5 border border-orange-100">
            <h2 class="text-2xl font-bold text-orange-950 mb-8 flex items-center gap-3">
              <span class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">🥖</span>
              Today's Fresh Batches
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex items-center gap-4 p-4 rounded-2xl bg-orange-50/50 border border-orange-100 hover:bg-orange-50 transition-colors">
                <div class="text-3xl">🥐</div>
                <div>
                  <h3 class="font-bold text-orange-950">Butter Croissant</h3>
                  <p class="text-xs text-orange-700">Flaky, golden, and rich</p>
                </div>
                <div class="ml-auto text-orange-900 font-black">$3.25</div>
              </div>
              <div class="flex items-center gap-4 p-4 rounded-2xl bg-orange-50/50 border border-orange-100 hover:bg-orange-50 transition-colors">
                <div class="text-3xl">🍞</div>
                <div>
                  <h3 class="font-bold text-orange-950">Sourdough Loaf</h3>
                  <p class="text-xs text-orange-700">36-hour slow fermentation</p>
                </div>
                <div class="ml-auto text-orange-900 font-black">$6.50</div>
              </div>
            </div>
            <div class="mt-12 text-center">
              <button class="bg-orange-900 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-orange-900/20 hover:scale-105 transition-all">Order for Collection</button>
            </div>
          </div>
        </main>
      </div>
    `)
  },
  'law-firm': {
    'index.html': HTML_STARTER('Sterling & Associates', `
      <div class="bg-slate-950 text-white min-h-screen font-serif">
        <nav class="border-b border-white/10 p-6 flex justify-between items-center">
          <div class="text-xl font-bold tracking-[0.2em] uppercase">STERLING <span class="text-amber-500">&</span> ASSOC</div>
          <div class="hidden md:flex gap-8 text-[10px] uppercase tracking-widest font-bold">
            <a href="#" class="hover:text-amber-500">Practice Areas</a>
            <a href="#" class="hover:text-amber-500">Attorneys</a>
            <a href="#" class="hover:text-amber-500">Contact</a>
          </div>
        </nav>
        <section class="py-32 px-6 max-w-5xl mx-auto text-center">
          <h1 class="text-5xl md:text-7xl font-bold mb-8 leading-tight">Unwavering Defense. <br/><span class="text-amber-500 italic">Proven Results.</span></h1>
          <p class="text-slate-400 text-lg max-w-2xl mx-auto mb-12 leading-relaxed font-sans">Specializing in high-stakes litigation and corporate law. We provide sophisticated counsel for complex legal challenges worldwide.</p>
          <button class="bg-amber-600 text-slate-950 px-12 py-5 rounded-sm font-sans font-bold uppercase tracking-widest text-xs hover:bg-amber-500 transition-colors">Request a Consultation</button>
        </section>
        <section class="grid grid-cols-1 md:grid-cols-3 border-t border-white/10 bg-slate-900/50">
          <div class="p-12 border-b md:border-b-0 md:border-r border-white/10">
            <h3 class="text-amber-500 font-bold mb-4 uppercase text-sm tracking-widest">Corporate Law</h3>
            <p class="text-slate-400 text-sm leading-relaxed font-sans">Strategic advice for mergers, acquisitions, and compliance in emerging markets.</p>
          </div>
          <div class="p-12 border-b md:border-b-0 md:border-r border-white/10">
            <h3 class="text-amber-500 font-bold mb-4 uppercase text-sm tracking-widest">Litigation</h3>
            <p class="text-slate-400 text-sm leading-relaxed font-sans">Expert trial attorneys dedicated to protecting your interests in federal and state courts.</p>
          </div>
          <div class="p-12">
            <h3 class="text-amber-500 font-bold mb-4 uppercase text-sm tracking-widest">Intellectual Property</h3>
            <p class="text-slate-400 text-sm leading-relaxed font-sans">Safeguarding your innovations and brand assets in the digital age.</p>
          </div>
        </section>
      </div>
    `)
  },
  'auto-repair': {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Copperhill Auto Repair | Straight Answers. Fair Prices.</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Oswald:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    h1, h2, h3, .heading-oswald { font-family: 'Oswald', sans-serif; text-transform: uppercase; }
  </style>
</head>
<body class="bg-[#111111] text-white min-h-screen">
  <!-- Top Navigation Bar -->
  <header class="border-b border-neutral-800 bg-[#161616]/90 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-amber-400 text-black font-black flex items-center justify-center rounded text-xl font-mono">C</div>
        <div>
          <span class="text-2xl font-black tracking-wider text-white font-mono block leading-none">COPPERHILL</span>
          <span class="text-[10px] text-amber-400 font-bold tracking-widest uppercase">Auto Repair & Service</span>
        </div>
      </div>
      <div class="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-neutral-300">
        <a href="#services" class="hover:text-amber-400 transition-colors">Services</a>
        <a href="#warning-lights" class="hover:text-amber-400 transition-colors">Warning Lights</a>
        <a href="#specials" class="hover:text-amber-400 transition-colors">Specials</a>
        <a href="#shop" class="hover:text-amber-400 transition-colors">The Shop</a>
        <a href="#hours" class="hover:text-amber-400 transition-colors">Hours</a>
      </div>
      <button class="bg-amber-400 text-black font-black px-5 py-2.5 rounded text-xs uppercase tracking-wider hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/10">
        Book a Drop-Off
      </button>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative bg-[#181818] border-b border-neutral-800 overflow-hidden py-16 md:py-24">
    <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-7 space-y-6">
        <div class="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">
          <span>INDEPENDENT SHOP</span>
          <span>•</span>
          <span>SINCE 1996</span>
        </div>
        <h1 class="text-5xl md:text-7xl font-black tracking-tight leading-none text-white">
          STRAIGHT ANSWERS.<br/>
          <span class="text-amber-400">FAIR PRICES.</span><br/>
          FIXED RIGHT.
        </h1>
        <p class="text-neutral-400 text-base max-w-xl leading-relaxed">
          Brakes, engines, electrical, AC and everyday maintenance for every make. You see the price range before you book, photos of what we find, and nothing gets done until you say yes.
        </p>

        <div class="flex flex-wrap items-center gap-6 pt-4 border-t border-neutral-800">
          <div class="flex items-center gap-2">
            <span class="text-amber-400 font-bold text-lg">4.9</span>
            <div class="text-amber-400 flex text-sm">★★★★★</div>
            <span class="text-neutral-500 text-xs">(840+ REVIEWS)</span>
          </div>
          <div class="text-neutral-400 text-xs border-l border-neutral-800 pl-6">
            <span class="text-white font-bold block">ASE CERTIFIED</span>
            <span>24 MONTH / 24,000 MILE WARRANTY</span>
          </div>
        </div>
      </div>

      <!-- Quick Quote Card -->
      <div class="lg:col-span-5 bg-[#202020] border border-neutral-700 p-8 rounded-xl shadow-2xl">
        <h3 class="text-2xl font-black uppercase text-white mb-6 border-b border-neutral-700 pb-3">Quick Quote</h3>
        <form class="space-y-4" onsubmit="event.preventDefault(); alert('Booking requested! Our technicians will confirm your time.');">
          <div>
            <label class="block text-xs font-bold uppercase text-neutral-400 mb-2">1. Your Vehicle</label>
            <div class="grid grid-cols-4 gap-2">
              <button type="button" class="py-2 bg-amber-400 text-black font-bold text-xs rounded">Car</button>
              <button type="button" class="py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded">SUV/Pickup</button>
              <button type="button" class="py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded">Hybrid</button>
              <button type="button" class="py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded">Electric</button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase text-neutral-400 mb-2">2. The Job</label>
            <select class="w-full bg-[#161616] border border-neutral-700 text-white p-3 rounded text-sm focus:border-amber-400 outline-none">
              <option>Brake pads and rotors</option>
              <option>Synthetic Oil Change & Inspection</option>
              <option>Wheel Alignment & Balance</option>
              <option>Check Engine Light Diagnostics</option>
            </select>
          </div>
          <div class="bg-[#161616] p-4 rounded border border-neutral-800 flex justify-between items-center">
            <div>
              <span class="text-[10px] text-neutral-500 uppercase font-bold block">Parts & Labor Est.</span>
              <span class="text-xs text-neutral-300">About 2 hours, same day</span>
            </div>
            <div class="text-right">
              <span class="text-2xl font-black text-amber-400">$319 to $489</span>
            </div>
          </div>
          <button type="submit" class="w-full bg-amber-400 text-black font-black py-4 rounded uppercase text-sm tracking-wider hover:bg-amber-300 transition-colors">
            Book This Job
          </button>
        </form>
      </div>
    </div>
  </section>

  <!-- Services Grid -->
  <section id="services" class="py-20 max-w-7xl mx-auto px-6">
    <div class="mb-12">
      <span class="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">SERVICES AND PRICES</span>
      <h2 class="text-4xl font-black text-white">WHAT WE FIX, AND WHAT IT USUALLY COSTS</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-[#181818] border border-neutral-800 p-6 rounded-lg hover:border-amber-400/50 transition-all group">
        <h3 class="text-lg font-bold text-white mb-1 group-hover:text-amber-400">SYNTHETIC OIL CHANGE</h3>
        <p class="text-xs text-neutral-400 mb-4">Up to 5 qts synthetic oil, OEM filter, and safety inspection.</p>
        <div class="flex justify-between items-baseline pt-4 border-t border-neutral-800">
          <span class="text-xs text-neutral-500 font-bold uppercase">From</span>
          <span class="text-xl font-black text-amber-400">$69</span>
        </div>
      </div>

      <div class="bg-[#181818] border border-neutral-800 p-6 rounded-lg hover:border-amber-400/50 transition-all group">
        <h3 class="text-lg font-bold text-white mb-1 group-hover:text-amber-400">COOLANT FLUSH</h3>
        <p class="text-xs text-neutral-400 mb-4">Full fluid exchange and pressure test radiator system.</p>
        <div class="flex justify-between items-baseline pt-4 border-t border-neutral-800">
          <span class="text-xs text-neutral-500 font-bold uppercase">From</span>
          <span class="text-xl font-black text-amber-400">$139</span>
        </div>
      </div>

      <div class="bg-[#181818] border border-neutral-800 p-6 rounded-lg hover:border-amber-400/50 transition-all group">
        <h3 class="text-lg font-bold text-white mb-1 group-hover:text-amber-400">SPARK PLUGS</h3>
        <p class="text-xs text-neutral-400 mb-4">OEM iridium spark plugs installation & ignition check.</p>
        <div class="flex justify-between items-baseline pt-4 border-t border-neutral-800">
          <span class="text-xs text-neutral-500 font-bold uppercase">From</span>
          <span class="text-xl font-black text-amber-400">$129</span>
        </div>
      </div>

      <div class="bg-[#181818] border border-neutral-800 p-6 rounded-lg hover:border-amber-400/50 transition-all group">
        <h3 class="text-lg font-bold text-white mb-1 group-hover:text-amber-400">BRAKE PADS & ROTORS</h3>
        <p class="text-xs text-neutral-400 mb-4">Premium ceramic brake pads and resurfaced/new rotors.</p>
        <div class="flex justify-between items-baseline pt-4 border-t border-neutral-800">
          <span class="text-xs text-neutral-500 font-bold uppercase">From</span>
          <span class="text-xl font-black text-amber-400">$319</span>
        </div>
      </div>
    </div>
  </section>
  <script src="app.js"></script>
</body>
</html>`,
    'app.js': `console.log("Copperhill Auto Repair Loaded Successfully!");`,
    'styles.css': `/* Custom styles for Copperhill */`
  },
  'ai-image-studio': {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Image Generator | Turn Words Into Images</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-white min-h-screen flex items-center justify-center p-6">
  <div class="max-w-xl w-full text-center space-y-8 bg-neutral-900/80 p-10 rounded-3xl border border-neutral-800 shadow-2xl backdrop-blur-xl">
    <div class="w-16 h-16 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/25">
      <span class="text-3xl">🎨</span>
    </div>
    <div class="space-y-3">
      <h1 class="text-4xl font-black tracking-tight">Turn words into images</h1>
      <p class="text-sm text-neutral-400 leading-relaxed max-w-md mx-auto">
        Describe anything, pick a style and a shape, and watch it appear. Everything you make is saved to your own private gallery.
      </p>
    </div>
    <div class="pt-4">
      <button onclick="alert('Signed in! Welcome to AI Image Generator.');" class="bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:bg-neutral-200 transition-all shadow-xl">
        Sign in with PERPLEXTA to start
      </button>
    </div>
  </div>
</body>
</html>`,
    'app.js': `console.log("AI Image Studio Loaded");`
  },
  'barbershop': {
    'index.html': HTML_STARTER('Gentlemen Barber Shop', `
      <div class="bg-zinc-950 text-white min-h-screen">
        <header class="p-8 border-b border-zinc-800 flex justify-between items-center max-w-6xl mx-auto">
          <div class="text-2xl font-black uppercase tracking-widest text-amber-500">BLADE & COMB</div>
          <button class="bg-amber-500 text-black px-6 py-2.5 font-black uppercase text-xs rounded tracking-wider">Book Chair</button>
        </header>
        <section class="py-24 max-w-4xl mx-auto text-center px-6">
          <h1 class="text-6xl font-black uppercase tracking-tight mb-6">Classic Cuts. Master Barbers.</h1>
          <p class="text-zinc-400 max-w-xl mx-auto mb-10 text-sm">Experience precision hair styling, hot towel beard shaves, and top-shelf grooming products.</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-16">
            <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
              <h3 class="text-amber-500 font-bold mb-2">Signature Haircut</h3>
              <p class="text-xs text-zinc-400 mb-4">Precision cut, shampoo, hot towel & style.</p>
              <span class="text-xl font-bold">$45</span>
            </div>
            <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
              <h3 class="text-amber-500 font-bold mb-2">Beard Sculpt & Trim</h3>
              <p class="text-xs text-zinc-400 mb-4">Straight razor lineup & essential oils.</p>
              <span class="text-xl font-bold">$35</span>
            </div>
            <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
              <h3 class="text-amber-500 font-bold mb-2">The Royal Treatment</h3>
              <p class="text-xs text-zinc-400 mb-4">Full haircut, beard shave & facial massage.</p>
              <span class="text-xl font-bold">$75</span>
            </div>
          </div>
        </section>
      </div>
    `)
  },
  'landing-page': {
    'index.html': HTML_STARTER('Product Landing', `
      <div class="bg-white text-gray-900 overflow-hidden">
        <header class="px-6 py-8 flex justify-between items-center max-w-7xl mx-auto">
          <div class="text-2xl font-black italic tracking-tighter">SOVEREIGN</div>
          <button class="bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold">Get Early Access</button>
        </header>
        <main class="pt-20 pb-32 px-6 max-w-5xl mx-auto text-center">
          <span class="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-8">v2.0 is now live</span>
          <h1 class="text-7xl md:text-8xl font-black tracking-tight leading-[0.9] mb-10">The Future of <br/><span class="text-blue-600">Engineering</span>.</h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-12">Build, deploy, and scale your applications with the world's most advanced AI-powered development studio.</p>
          <div class="flex justify-center gap-4">
            <button class="bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-600/30">Start Building Free</button>
          </div>
          <div class="mt-20 relative">
            <div class="aspect-video bg-gray-100 rounded-[40px] shadow-2xl border-8 border-white overflow-hidden">
              <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop" class="w-full h-full object-cover" />
            </div>
            <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
            <div class="absolute -top-10 -left-10 w-40 h-40 bg-indigo-600 rounded-full blur-3xl opacity-20"></div>
          </div>
        </main>
      </div>
    `),
    'marketing.js': `// Scroll animations\nconsole.log('Landing loaded');`
  }
};

const _templateFilesCache = new Map<string, Promise<Record<string, string>>>();

export async function fetchStudioTemplateFiles(template: StudioTemplate): Promise<Record<string, string>> {
  const slug = template.slug;
  if (_templateFilesCache.has(slug)) {
    return _templateFilesCache.get(slug)!;
  }

  const filePaths = Array.isArray(template.filePaths) && template.filePaths.length > 0
    ? template.filePaths
    : ['index.html', 'styles.css', 'app.js'];

  const baseRawUrl = `https://raw.githubusercontent.com/Osama-Qonaibe/builder/main/src/templates/${slug}/files`;

  const promise = (async () => {
    try {
      const discoveredImages = new Set<string>();
      const entries = await Promise.all(
        filePaths.map(async (relPath) => {
          const res = await fetch(`${baseRawUrl}/${relPath}`, { cache: 'force-cache' });
          if (!res.ok) throw new Error(`HTTP ${res.status} for ${relPath}`);
          let text = await res.text();
          // Discover relative photo/image assets so they appear in the Studio Code file tree (e.g. photos/*.jpg)
          const assetMatches = text.matchAll(/(?:photos|images|assets)\/[a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp|svg|gif)/gi);
          for (const m of assetMatches) {
            if (m[0]) discoveredImages.add(m[0]);
          }
          // Rewrite relative photos/, images/, assets/, and icon.svg references to absolute raw URLs so images render in iframe preview
          text = text
            .replace(/(["'(\s])(?:\.\/)?photos\//g, `$1${baseRawUrl}/photos/`)
            .replace(/(["'(\s])(?:\.\/)?images\//g, `$1${baseRawUrl}/images/`)
            .replace(/(["'(\s])(?:\.\/)?assets\//g, `$1${baseRawUrl}/assets/`)
            .replace(/(["'(\s])(?:\.\/)?icon\.svg(["'#?)\s])/g, `$1${baseRawUrl}/icon.svg$2`)
            .replace(/<script[^>]*js\.puter\.com[^>]*><\/script>/gi, '')
            .replace(/<script[^>]*runtime\.js[^>]*><\/script>/gi, '');
          return [relPath, text] as const;
        })
      );
      const loaded: Record<string, string> = {};
      for (const [p, content] of entries) {
        loaded[p] = content;
      }
      for (const imgPath of Array.from(discoveredImages).sort()) {
        if (!loaded[imgPath]) {
          loaded[imgPath] = `${baseRawUrl}/${imgPath}`;
        }
      }
      if (Object.keys(loaded).length > 0) {
        return loaded;
      }
    } catch (_err) {
      _templateFilesCache.delete(slug);
    }

    return CORE_TEMPLATES_PAYLOADS[slug] || template.files || {
      'index.html': HTML_STARTER(template.name, `
        <div class="max-w-4xl mx-auto py-16 px-6 text-center space-y-6">
          <span class="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">${template.category || 'Application'}</span>
          <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900">${template.name}</h1>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">${template.description}</p>
        </div>
      `),
      'styles.css': `/* ${template.name} Styles */\nbody { margin: 0; }`,
      'app.js': `// ${template.name} Application Logic\nconsole.log('${template.name} initialized');`
    };
  })();

  _templateFilesCache.set(slug, promise);
  return promise;
}

export const getTemplateWithFiles = (template: StudioTemplate): StudioTemplate => {
  return {
    ...template,
    files: CORE_TEMPLATES_PAYLOADS[template.slug] || {
      'index.html': HTML_STARTER(template.name),
      'app.js': `// Auto-generated for ${template.name}\nconsole.log('App started');`
    }
  };
};

