"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* ─── Data ──────────────────────────────────────────── */

const STYLES = [
  {
    name: "Sherwani",
    when: "Main ceremony",
    desc: "The classic. 2026 is all about tone-on-tone threadwork, cape silhouettes, and angrakha wraps. Less bling, more craft.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=400&fit=crop",
  },
  {
    name: "Bandhgala",
    when: "Reception / Cocktail",
    desc: "Biggest trend jump this year. Sharp tailoring, velvet-suede blends, raw silk. European ceremony jacket with Indian soul.",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop",
  },
  {
    name: "Indo-Western",
    when: "Sangeet / Cocktail",
    desc: "Asymmetric achkans, draped bandhgalas, jacket-sherwanis with detachable elements. Western tailoring + Indian embellishment.",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=400&fit=crop",
  },
  {
    name: "Kurta Set",
    when: "Mehendi / Haldi",
    desc: "Hip-length, straight trousers, minimal embellishment. Focus on fabric and fit. The easy, comfortable choice.",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=400&fit=crop",
  },
];

const DESIGNERS = [
  {
    name: "Sabyasachi",
    ig: "sabyasachiofficial",
    vibe: "Heritage maximalism",
    price: "3L+",
    known: "Ivory & gold sherwanis, heirloom embroidery. Vicky Kaushal & Ranveer wore him.",
  },
  {
    name: "Manish Malhotra",
    ig: "manishmalhotra05",
    vibe: "Bollywood glamour",
    price: "2L+",
    known: "Velvet sherwanis, cinematic embellishment. Sidharth Malhotra's gold sherwani.",
  },
  {
    name: "Raghavendra Rathore",
    ig: "raghavendra.rathore",
    vibe: "Princely minimalism",
    price: "1.5L+",
    known: "The Jodhpuri suit master. Clean lines, zero excess. Bespoke only.",
  },
  {
    name: "Shantanu & Nikhil",
    ig: "shantanunikhil",
    vibe: "Modern power dressing",
    price: "1L+",
    known: "Structured couture, military-inspired, dramatic silhouettes.",
  },
  {
    name: "Kunal Rawal",
    ig: "kunalrawaldotcom",
    vibe: "Edgy experimentalist",
    price: "80K+",
    known: "Bold colors, unusual fabrics. The cocktail/sangeet king.",
  },
  {
    name: "Tarun Tahiliani",
    ig: "taruntahiliani",
    vibe: "Sculptural grace",
    price: "1.5L+",
    known: "Fluid draping, embroidered stoles. Also runs Tasva (accessible line).",
  },
  {
    name: "Anita Dongre",
    ig: "anitadongre",
    vibe: "Sustainable elegance",
    price: "80K+",
    known: "Light eco-conscious fabrics, pastels, destination weddings.",
  },
  {
    name: "Manyavar",
    ig: "manyavar",
    vibe: "Accessible for everyone",
    price: "15K+",
    known: "Widest range, all budgets, pan-India stores. Good starting point.",
  },
];

const INSPO_ACCOUNTS = [
  { handle: "indiangroom", followers: "109K", desc: "Curated groom looks from real weddings" },
  { handle: "lakshay_thakur", followers: "239K", desc: "Men's traditional fashion styling" },
  { handle: "manishmalhotravows", followers: "–", desc: "MM's wedding-specific account" },
  { handle: "weddingsutra", followers: "1.2M", desc: "India's top wedding platform" },
  { handle: "wedmegood", followers: "3M", desc: "Real wedding looks + vendor discovery" },
  { handle: "weddingbazaar", followers: "500K", desc: "Wedding inspo + planning" },
];

const CELEB_LOOKS = [
  { name: "Vicky Kaushal", designer: "Sabyasachi", desc: "Ivory sherwani, emerald jewelry, Banarasi safa. THE reference look.", tag: "vickykaushalwedding" },
  { name: "Ranveer Singh", designer: "Sabyasachi", desc: "Deep red for ceremony, ivory + silver for reception. Two moods, both iconic.", tag: "ranveersinghwedding" },
  { name: "Sidharth Malhotra", designer: "Manish Malhotra", desc: "Metallic gold with ivory threadwork. Modern Bollywood royalty.", tag: "sidharthmalhotrawedding" },
  { name: "Ranbir Kapoor", designer: "Sabyasachi", desc: "Clean understated ivory. Less is more, perfectly done.", tag: "ranbirkapoorwedding" },
];

const COLORS = [
  { group: "Pastels (trending)", items: ["Powder Pink", "Dusty Lavender", "Ice Blue", "Sage Mint", "Champagne"], hexes: ["#E8C4C4", "#B4A7D6", "#B5D4E8", "#B5C9B3", "#E8D5B7"] },
  { group: "Jewel Tones", items: ["Deep Plum", "Midnight Blue", "Emerald", "Wine", "Amber"], hexes: ["#6B3A5E", "#1B3A5C", "#2D6A4F", "#722F37", "#B8860B"] },
  { group: "Classics", items: ["Ivory", "Cream", "Gold", "Charcoal", "Stone"], hexes: ["#FFFFF0", "#FFFDD0", "#C9A84C", "#36454F", "#928E85"] },
];

const SHOPS = [
  { name: "Manyavar", url: "https://www.manyavar.com", note: "All budgets" },
  { name: "Tasva", url: "https://www.tasva.com", note: "Tarun Tahiliani's line" },
  { name: "Pernia's Pop-Up Shop", url: "https://www.perniaspopupshop.com", note: "Multi-designer luxury" },
  { name: "AZA Fashions", url: "https://www.azafashions.com", note: "Designer menswear" },
  { name: "Kalki Fashion", url: "https://www.kalkifashion.com", note: "Groom + bridal sets" },
  { name: "Rathore", url: "https://www.rathore.com", note: "Bespoke Jodhpuri" },
];

/* ─── Component ─────────────────────────────────────── */

function InstagramLink({ handle }: { handle: string }) {
  return (
    <a
      href={`https://www.instagram.com/${handle}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-pink-600 hover:text-pink-700 hover:underline"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
      @{handle}
    </a>
  );
}

export function GroomFashionContent() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl">
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=400&fit=crop"
          alt="Groom fashion"
          width={1200}
          height={400}
          className="h-48 w-full object-cover brightness-50 sm:h-56"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Groom Fashion 2026
          </h1>
          <p className="mt-1 text-sm text-white/80">
            What to wear, who to follow, where to buy
          </p>
        </div>
      </div>

      {/* ─── What to Wear ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">What to Wear</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {STYLES.map((s) => (
            <Card key={s.name} className="overflow-hidden">
              <Image
                src={s.image}
                alt={s.name}
                width={600}
                height={400}
                className="h-40 w-full object-cover"
              />
              <CardContent className="pt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{s.name}</h3>
                  <Badge variant="outline" className="text-xs">{s.when}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ─── Colors ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Trending Colors</h2>
        <div className="space-y-4">
          {COLORS.map((group) => (
            <div key={group.group}>
              <p className="mb-2 text-sm font-medium">{group.group}</p>
              <div className="flex gap-3">
                {group.items.map((name, i) => (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div
                      className="h-10 w-10 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: group.hexes[i] }}
                    />
                    <span className="text-[10px] text-muted-foreground text-center leading-tight w-12">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ─── Designers ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Top Designers</h2>
        <div className="space-y-3">
          {DESIGNERS.map((d) => (
            <Card key={d.name}>
              <CardContent className="flex items-start justify-between gap-3 pt-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{d.name}</h3>
                    <span className="text-xs text-muted-foreground">({d.vibe})</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{d.known}</p>
                  <div className="mt-2">
                    <InstagramLink handle={d.ig} />
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {d.price}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ─── Instagram Accounts ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Instagram Accounts to Follow</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {INSPO_ACCOUNTS.map((a) => (
            <a
              key={a.handle}
              href={`https://www.instagram.com/${a.handle}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">@{a.handle}</span>
                  <span className="text-xs text-muted-foreground">{a.followers}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <Separator />

      {/* ─── Celebrity Looks ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Celebrity Looks to Reference</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CELEB_LOOKS.map((c) => (
            <a
              key={c.name}
              href={`https://www.instagram.com/explore/tags/${c.tag}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{c.name}</span>
                <Badge variant="outline" className="text-xs">{c.designer}</Badge>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.desc}</p>
              <p className="mt-2 text-xs text-pink-600">#{c.tag} on Instagram</p>
            </a>
          ))}
        </div>
      </section>

      <Separator />

      {/* ─── Quick Guide ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Quick Guide</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-sm mb-2">By Function</h3>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Pheras:</strong> Long sherwani + safa + jewelry</p>
                <p><strong className="text-foreground">Reception:</strong> Bandhgala or Jodhpuri suit</p>
                <p><strong className="text-foreground">Sangeet:</strong> Indo-western or bold kurta</p>
                <p><strong className="text-foreground">Mehendi:</strong> Light kurta set, pastels</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-sm mb-2">By Budget</h3>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Under 50K:</strong> Manyavar, Tasva, Kalki</p>
                <p><strong className="text-foreground">50K - 2L:</strong> Kunal Rawal, Anita Dongre</p>
                <p><strong className="text-foreground">2L - 5L:</strong> Rathore, Tarun Tahiliani</p>
                <p><strong className="text-foreground">5L+:</strong> Sabyasachi, Manish Malhotra</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ─── Where to Buy ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Where to Buy Online</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {SHOPS.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div>
                <span className="text-sm font-medium">{s.name}</span>
                <p className="text-xs text-muted-foreground">{s.note}</p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      </section>

      {/* Share */}
      <div className="flex justify-center py-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            const url = window.location.href;
            if (navigator.share) {
              navigator.share({ title: "Groom Fashion 2026", url });
            } else {
              navigator.clipboard.writeText(url);
              alert("Link copied!");
            }
          }}
        >
          Share this page
        </Button>
      </div>
    </div>
  );
}
