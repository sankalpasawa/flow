"use client";

import { InfoSection } from "@/components/research/info-section";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ─── Data ──────────────────────────────────────────── */

const STYLE_TRENDS = [
  {
    name: "Long Sherwani",
    vibe: "Classic King",
    description:
      "Below-knee, structured, regal. 2026 shifts toward sculptural craftsmanship — raised threadwork, geometric quilting, tone-on-tone zardozi. Cape silhouettes and angrakha-style wraps are trending.",
    bestFor: "Main ceremony (pheras / varmala)",
    tags: ["Timeless", "Heritage", "Statement"],
  },
  {
    name: "Bandhgala",
    vibe: "Breakout Star of 2026",
    description:
      "Razor-sharp tailoring meets softer shoulders. Velvet-suede blends, raw silk, textured jacquard. The European ceremonial jacket with Indian soul. Biggest trend jump this year.",
    bestFor: "Cocktail, reception, sangeet",
    tags: ["Sharp", "Modern", "Versatile"],
  },
  {
    name: "Indo-Western Fusion",
    vibe: "Soft Hybridity",
    description:
      "Western tailoring structure + Indian embellishment. Asymmetric achkans, angarakha-style jackets, draped bandhgalas, jacket-sherwanis with detachable elements.",
    bestFor: "Sangeet, cocktail, reception",
    tags: ["Contemporary", "Bold", "Experimental"],
  },
  {
    name: "Kurta Sets",
    vibe: "Effortless Cool",
    description:
      "Hip-length short sherwanis with straight trousers. Minimal embellishment, focus on fabric and fit. The modern groom's go-to for less formal functions.",
    bestFor: "Mehendi, haldi, pre-wedding events",
    tags: ["Casual", "Comfortable", "Clean"],
  },
  {
    name: "Jodhpuri Suit",
    vibe: "Princely Precision",
    description:
      "Structured, bespoke, royal. Associated with Raghavendra Rathore's iconic Jodhpur aesthetic. Clean lines, no excess embellishment — the outfit speaks through cut.",
    bestFor: "Reception, formal events",
    tags: ["Bespoke", "Royal", "Minimalist"],
  },
];

const DESIGNERS = [
  {
    name: "Sabyasachi Mukherjee",
    instagram: "@sabyasachiofficial",
    instagramUrl: "https://www.instagram.com/sabyasachiofficial/",
    website: "https://www.sabyasachi.com",
    specialty: "Heritage sherwanis, ivory/gold/jewel tones, heirloom hand-embroidery",
    priceRange: "₹3L – ₹25L+",
    vibe: "Heirloom maximalism",
  },
  {
    name: "Manish Malhotra",
    instagram: "@manishmalhotra05",
    instagramUrl: "https://www.instagram.com/manishmalhotra05/",
    website: "https://www.manishmalhotra.in",
    specialty: "Cinematic velvet sherwanis, embellished Indo-westerns, Bollywood couture",
    priceRange: "₹2L – ₹20L+",
    vibe: "Bollywood glamour",
  },
  {
    name: "Raghavendra Rathore",
    instagram: "@raghavendra.rathore",
    instagramUrl: "https://www.instagram.com/raghavendra.rathore/",
    website: "https://www.rathore.com",
    specialty: "Minimalist Jodhpuri bespoke menswear, structured heritage looks",
    priceRange: "₹1.5L – ₹10L+",
    vibe: "Princely restraint",
  },
  {
    name: "Shantanu & Nikhil",
    instagram: "@shantanunikhil",
    instagramUrl: "https://www.instagram.com/shantanunikhil/",
    website: "https://www.shantanunikhil.com",
    specialty: "Contemporary structured couture, dramatic silhouettes, military-inspired",
    priceRange: "₹1L – ₹8L+",
    vibe: "Modern Indian power dressing",
  },
  {
    name: "Kunal Rawal",
    instagram: "@kunalrawaldotcom",
    instagramUrl: "https://www.instagram.com/kunalrawaldotcom/",
    website: "https://www.kunalrawal.com",
    specialty: "Bold colors, innovative cuts, unusual fabrics — the cocktail/sangeet king",
    priceRange: "₹80K – ₹6L+",
    vibe: "Edgy experimentalist",
  },
  {
    name: "Tarun Tahiliani",
    instagram: "@taraborellitahiliani",
    instagramUrl: "https://www.instagram.com/taraborellitahiliani/",
    website: "https://www.taruntahiliani.com",
    specialty: "Fluid draping, refined embroidery, embroidered stoles, timeless elegance",
    priceRange: "₹1.5L – ₹12L+",
    vibe: "Sculptural grace",
  },
  {
    name: "Anita Dongre",
    instagram: "@aaborell",
    instagramUrl: "https://www.instagram.com/anitadongre/",
    website: "https://www.anitadongre.com",
    specialty: "Light eco-conscious fabrics, pastel palettes, day weddings, destination-friendly",
    priceRange: "₹80K – ₹5L+",
    vibe: "Sustainable elegance",
  },
  {
    name: "Manyavar / Tasva",
    instagram: "@manyavar",
    instagramUrl: "https://www.instagram.com/manyavar/",
    website: "https://www.manyavar.com",
    specialty: "Mass-premium, widest range, all budgets. Tasva (by Tarun Tahiliani) for accessible luxury",
    priceRange: "₹15K – ₹1.5L",
    vibe: "Accessible for everyone",
  },
];

const INSTAGRAM_INSPO = [
  {
    handle: "@indiangroom",
    url: "https://www.instagram.com/indiangroom/",
    followers: "109K",
    description: "Dedicated Indian groom menswear — curated looks, real weddings, designer features",
  },
  {
    handle: "@lakshay_thakur",
    url: "https://www.instagram.com/lakshay_thakur/",
    followers: "239K",
    description: "Indian men's traditional fashion influencer — styling, outfit ideas, reels",
  },
  {
    handle: "@manishmalhotravows",
    url: "https://www.instagram.com/manishmalhotravows/",
    followers: "–",
    description: "Manish Malhotra's wedding-specific account — bridal & groom couture",
  },
  {
    handle: "@weddingsutra",
    url: "https://www.instagram.com/weddingsutra/",
    followers: "1.2M+",
    description: "India's leading wedding platform — groom style edits, trend reports",
  },
  {
    handle: "@wedmegood",
    url: "https://www.instagram.com/wedmegood/",
    followers: "3M+",
    description: "Wedding planning platform — real wedding groom looks, vendor discovery",
  },
  {
    handle: "@weddingbazaar",
    url: "https://www.instagram.com/weddingbazaar/",
    followers: "500K+",
    description: "Wedding inspiration — groom outfits, decor, planning tips",
  },
];

const CELEB_LOOKS = [
  {
    name: "Vicky Kaushal",
    designer: "Sabyasachi",
    look: "Ivory sherwani with floral motifs, heavy emerald & diamond jewelry, tussar georgette shawl, Banarasi silk safa",
    vibe: "The most referenced groom look in recent years. Gold standard for traditional grandeur.",
    searchTag: "#vickykaushalwedding",
  },
  {
    name: "Ranveer Singh",
    designer: "Sabyasachi + Abu Jani Sandeep Khosla",
    look: "Deep red sherwani (Sindhi ceremony) + ivory with silver threadwork & pearls (reception)",
    vibe: "Maximalist, unapologetic, joyful. Two distinct moods for two functions.",
    searchTag: "#ranveersinghwedding",
  },
  {
    name: "Sidharth Malhotra",
    designer: "Manish Malhotra",
    look: "Metallic gold sherwani with ivory threadwork, gold zardozi, badla embroidery",
    vibe: "Modern Bollywood royalty. Gold done right — warm, not flashy.",
    searchTag: "#sidharthmalhotrawedding",
  },
  {
    name: "Ranbir Kapoor",
    designer: "Sabyasachi",
    look: "Clean understated ivory sherwani, minimal jewelry, elegant simplicity",
    vibe: "For grooms who want subtle sophistication. Less is more, perfectly executed.",
    searchTag: "#ranbirkapoorwedding",
  },
];

const COLOR_PALETTES = [
  {
    name: "Pastels",
    trending: true,
    description: "The #1 trend for 2026. Photographs beautifully in natural light.",
    colors: [
      { name: "Powder Pink", hex: "#E8C4C4" },
      { name: "Dusty Lavender", hex: "#B4A7D6" },
      { name: "Ice Blue", hex: "#B5D4E8" },
      { name: "Sage Mint", hex: "#B5C9B3" },
      { name: "Champagne", hex: "#E8D5B7" },
      { name: "Pearl Grey", hex: "#C8C8C8" },
    ],
  },
  {
    name: "Jewel Tones",
    trending: false,
    description: "Rich, photogenic, flattering on Indian skin tones. Best for winter weddings.",
    colors: [
      { name: "Deep Plum", hex: "#6B3A5E" },
      { name: "Midnight Blue", hex: "#1B3A5C" },
      { name: "Emerald", hex: "#2D6A4F" },
      { name: "Wine", hex: "#722F37" },
      { name: "Amber", hex: "#B8860B" },
      { name: "Amethyst", hex: "#7B5EA7" },
    ],
  },
  {
    name: "Classic / Timeless",
    trending: false,
    description: "Eternally photogenic. Ivory and gold are always safe bets.",
    colors: [
      { name: "Ivory", hex: "#FFFFF0" },
      { name: "Cream", hex: "#FFFDD0" },
      { name: "Gold", hex: "#C9A84C" },
      { name: "Almond", hex: "#EFDECD" },
      { name: "Stone", hex: "#928E85" },
      { name: "Charcoal", hex: "#36454F" },
    ],
  },
];

const ACCESSORIES = [
  {
    name: "Safa / Turban",
    description:
      "The most important accessory. Handwoven pagdis, organza drapes, vintage Banarasi borders, color-dipped fabrics. Jewel-toned safa + ivory sherwani is the most-photographed combo of 2026.",
    tip: "Add a sarpech (brooch) for princely impact.",
  },
  {
    name: "Brooch / Sarpech",
    description:
      "Pinned to the front of the turban or lapel. Pearl or kundan pieces trending. Minimalist brooches over heavy ornate styles.",
    tip: "Match metal tone to your jewelry.",
  },
  {
    name: "Necklace / Mala",
    description:
      "Layered uncut polki necklaces, structured pearl malas, emerald-and-diamond sets. Vicky Kaushal's heavy emerald look remains a major reference.",
    tip: "One statement piece > multiple small ones.",
  },
  {
    name: "Juttis / Mojaris",
    description:
      "Intricate embroidery, beadwork, metallic accents. Flat toe, no socks. Can match or contrast sherwani color.",
    tip: "Break them in before the wedding day.",
  },
  {
    name: "Stole / Dupatta",
    description:
      "Tussar georgette shawls, embroidered dupatta stoles — adds a layered, regal dimension. Drape over one shoulder.",
    tip: "Lighter fabrics drape better for photos.",
  },
];

const SHOPS = [
  { name: "Manyavar", url: "https://www.manyavar.com", best: "All budgets, largest selection, pan-India stores" },
  { name: "Tasva", url: "https://www.tasva.com", best: "Tarun Tahiliani's accessible luxury line" },
  { name: "Pernia's Pop-Up Shop", url: "https://www.perniaspopupshop.com", best: "Multi-designer luxury curation" },
  { name: "AZA Fashions", url: "https://www.azafashions.com", best: "Designer menswear, bespoke labels" },
  { name: "Kalki Fashion", url: "https://www.kalkifashion.com", best: "Bridal + groom sets, accessible luxury" },
  { name: "Utsav Fashion", url: "https://www.utsavfashion.com", best: "Wide range, global shipping, customization" },
  { name: "Ogaan", url: "https://www.ogaan.com", best: "Niche designer menswear" },
  { name: "Rathore (direct)", url: "https://www.rathore.com", best: "Bespoke Jodhpuri suits from the master" },
];

const HASHTAGS = [
  "#groomfashion2026",
  "#indiangroom",
  "#groomsherwani",
  "#weddingsherwani",
  "#groomstyle",
  "#indianwedding2026",
  "#groomwear",
  "#weddingmenswear",
  "#indiangroomwear",
  "#bandhgala",
  "#sherwanidesign",
  "#groomoutfit",
];

/* ─── Component ─────────────────────────────────────── */

export function GroomFashionContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Groom Fashion Trends 2026
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The complete style guide — trending silhouettes, top designers, Instagram inspo, color palettes, and where to buy
        </p>
      </div>

      <Separator />

      {/* ─── Trending Styles ─── */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Trending Silhouettes</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {STYLE_TRENDS.map((style) => (
            <Card key={style.name}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{style.name}</CardTitle>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {style.vibe}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{style.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Best for:</strong> {style.bestFor}
                </p>
                <div className="flex flex-wrap gap-1">
                  {style.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* ─── Color Palettes ─── */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Color Trends</h2>
        <div className="space-y-4">
          {COLOR_PALETTES.map((palette) => (
            <Card key={palette.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{palette.name}</CardTitle>
                  {palette.trending && (
                    <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                      #1 Trend
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{palette.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {palette.colors.map((c) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded-md border border-border shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-xs text-muted-foreground">{c.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* ─── Top Designers ─── */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Top Designers</h2>
        <div className="space-y-3">
          {DESIGNERS.map((d) => (
            <Card key={d.name}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm">{d.name}</h3>
                    <a
                      href={d.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {d.instagram}
                    </a>
                    {" · "}
                    <a
                      href={d.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {d.priceRange}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{d.specialty}</p>
                <p className="text-xs italic text-muted-foreground">Vibe: {d.vibe}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* ─── Instagram Inspo ─── */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Instagram Accounts to Follow</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {INSTAGRAM_INSPO.map((account) => (
            <Card key={account.handle}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <a
                    href={account.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sm text-blue-600 hover:underline"
                  >
                    {account.handle}
                  </a>
                  <span className="text-xs text-muted-foreground">{account.followers}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{account.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {HASHTAGS.map((h) => (
            <a
              key={h}
              href={`https://www.instagram.com/explore/tags/${h.slice(1)}/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge variant="secondary" className="text-xs hover:bg-secondary/80 cursor-pointer">
                {h}
              </Badge>
            </a>
          ))}
        </div>
      </div>

      <Separator />

      {/* ─── Celebrity Looks ─── */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Celebrity Reference Looks</h2>
        <div className="space-y-3">
          {CELEB_LOOKS.map((celeb) => (
            <Card key={celeb.name}>
              <CardContent className="pt-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{celeb.name}</h3>
                  <Badge variant="outline" className="text-xs">{celeb.designer}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{celeb.look}</p>
                <p className="text-xs italic text-muted-foreground">{celeb.vibe}</p>
                <a
                  href={`https://www.instagram.com/explore/tags/${celeb.searchTag.slice(1)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Search {celeb.searchTag} on Instagram
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* ─── Accessories ─── */}
      <InfoSection title="Trending Accessories">
        <div className="space-y-3">
          {ACCESSORIES.map((acc) => (
            <div key={acc.name} className="space-y-1">
              <h4 className="font-medium text-foreground">{acc.name}</h4>
              <p className="text-sm">{acc.description}</p>
              <p className="text-xs italic">Tip: {acc.tip}</p>
            </div>
          ))}
        </div>
      </InfoSection>

      <Separator />

      {/* ─── Where to Buy ─── */}
      <InfoSection title="Where to Buy Online">
        <div className="space-y-2">
          {SHOPS.map((shop) => (
            <div key={shop.name} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <a
                  href={shop.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sm text-blue-600 hover:underline"
                >
                  {shop.name}
                </a>
                <p className="text-xs text-muted-foreground">{shop.best}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">Shop</Badge>
            </div>
          ))}
        </div>
      </InfoSection>

      {/* ─── Quick Decision Guide ─── */}
      <InfoSection title="Quick Decision Guide">
        <div className="space-y-2">
          <div>
            <h4 className="font-medium text-foreground">By Function</h4>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li><strong>Pheras / Main ceremony:</strong> Long sherwani (ivory/gold/red) + safa + jewelry</li>
              <li><strong>Reception:</strong> Bandhgala or Jodhpuri suit (midnight blue / deep plum / charcoal)</li>
              <li><strong>Sangeet / Cocktail:</strong> Indo-western or bold kurta set (pastels / teal / emerald)</li>
              <li><strong>Mehendi / Haldi:</strong> Short kurta set (light pastels / prints)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground">By Budget</h4>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li><strong>Under ₹50K:</strong> Manyavar, Tasva, Kalki Fashion</li>
              <li><strong>₹50K – ₹2L:</strong> Kunal Rawal, Anita Dongre, Shantanu & Nikhil</li>
              <li><strong>₹2L – ₹5L:</strong> Raghavendra Rathore, Tarun Tahiliani</li>
              <li><strong>₹5L+:</strong> Sabyasachi, Manish Malhotra</li>
            </ul>
          </div>
        </div>
      </InfoSection>

      {/* Share */}
      <div className="flex justify-center py-4">
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied! Share it on WhatsApp.");
          }}
        >
          Copy Link to Share
        </Button>
      </div>
    </div>
  );
}
