"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* ─── Data ──────────────────────────────────────────── */

const STYLES = [
  {
    name: "Lehenga",
    when: "Main ceremony",
    desc: "Still the queen. 2026 is about ombre gradients, lighter fabrics, and corset blouses. Less zardozi, more movement. The skirt moves, the blouse is the hero.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=400&fit=crop",
  },
  {
    name: "Saree",
    when: "Reception / Sangeet",
    desc: "Pre-draped is the new norm. Tissue and organza, sheer with hand-placed crystals. Ethereal and effortless. Alia Bhatt's ivory saree started a revolution.",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=400&fit=crop",
  },
  {
    name: "Sharara / Gharara",
    when: "Mehendi / Nikah",
    desc: "Flared palazzo-style bottoms with kurtas. Surging as a lehenga alternative. Comfortable, fun, and photographs beautifully.",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=400&fit=crop",
  },
  {
    name: "Cape Lehenga",
    when: "Cocktail / Reception",
    desc: "Lehenga skirt + sheer embroidered cape replacing the dupatta. Modern, dramatic, zero pinning required. The 2026 statement silhouette.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop",
  },
];

const DESIGNERS = [
  {
    name: "Sabyasachi",
    ig: "sabyasachiofficial",
    bridalIg: "bridesofsabyasachi",
    vibe: "Heritage maximalism",
    price: "5L+",
    known: "THE bridal designer. Layered embroidery, jewel tones, heirloom fabrics. Every A-list bride's first call.",
  },
  {
    name: "Manish Malhotra",
    ig: "manishmalhotra05",
    vibe: "Bollywood glamour",
    price: "3L+",
    known: "Sequin and zardozi work, cinematic polish. Heavy embellishment done tastefully.",
  },
  {
    name: "Tarun Tahiliani",
    ig: "taruntahiliani",
    vibe: "Architectural precision",
    price: "2L+",
    known: "Indian craft + Western construction. Draped gowns, precise tailoring. For the bride who wants structure.",
  },
  {
    name: "Anita Dongre",
    ig: "anitadongre",
    vibe: "Sustainable elegance",
    price: "80K+",
    known: "Floral motifs, earthy palettes, organic fabrics. Perfect for destination and day weddings.",
  },
  {
    name: "Falguni Shane Peacock",
    ig: "falgunishanepeacock",
    vibe: "High-octane glamour",
    price: "3L+",
    known: "Crystal embellishment, sequin lehengas, reception gowns. For brides who want to sparkle.",
  },
  {
    name: "Anamika Khanna",
    ig: "anamikakhanna",
    vibe: "Fluid minimalism",
    price: "2L+",
    known: "Unstructured draping, earthy minimalism, fusion styling. The anti-maximalist bride's designer.",
  },
  {
    name: "Rahul Mishra",
    ig: "rahulmishra_6",
    vibe: "Sustainable couture",
    price: "3L+",
    known: "Hand-embroidery inspired by nature. Paris couture week regular. Art meets bridal wear.",
  },
  {
    name: "Kalki Fashion",
    ig: "kalkifashion",
    vibe: "Accessible luxury",
    price: "10K+",
    known: "Widest range online. Bridal lehengas, sarees, and matching sets at every price point.",
  },
];

const INSPO_ACCOUNTS = [
  { handle: "bridesofsabyasachi", followers: "2M+", desc: "Real brides in Sabyasachi — the reference account" },
  { handle: "wedmegood", followers: "3M", desc: "India's largest wedding platform, huge bridal library" },
  { handle: "weddingsutra", followers: "1.2M", desc: "Celebrity and editorial bridal looks" },
  { handle: "masoomminawala", followers: "1.3M", desc: "Global Indian fashion influencer, luxury lehengas" },
  { handle: "vaborellindia", followers: "–", desc: "Vogue India — high fashion bridal editorial" },
  { handle: "brides_of_india", followers: "200K+", desc: "Aggregated real bride looks from across India" },
];

const CELEB_LOOKS = [
  { name: "Alia Bhatt", designer: "Sabyasachi", desc: "Ivory hand-embroidered saree. THE minimalist revolution. Most replicated bridal look of the decade.", tag: "aliabhatt" },
  { name: "Rashmika Mandanna", designer: "Sabyasachi", desc: "Feb 2026, Udaipur. One of the most-watched celebrity weddings of 2026.", tag: "rashmikamandanna" },
  { name: "Alekha Advani", designer: "Manish Malhotra + FSP", desc: "Sleek ivory MM saree + gold FSP reception lehenga. Two distinct looks, both viral.", tag: "aadarjain" },
  { name: "Priyanka Chopra", designer: "Custom Varanasi", desc: "Handwoven Varanasi silk with kundan jewelry. Celebrating craft over excess.", tag: "priyankachopra" },
];

const COLORS = [
  { group: "Pastels (trending)", items: ["Blush Pink", "Lilac", "Sage Green", "Butter Yellow", "Dusty Rose"], hexes: ["#F4C2C2", "#C8A2C8", "#B2AC88", "#F5E6A3", "#DCAE96"] },
  { group: "Jewel Tones", items: ["Deep Emerald", "Sapphire", "Terracotta", "Magenta", "Ruby"], hexes: ["#046307", "#0F52BA", "#C04000", "#FF0090", "#9B111E"] },
  { group: "Modern Bridal", items: ["Ivory", "Champagne", "Gold", "Ombre Pink", "Copper"], hexes: ["#FFFFF0", "#F7E7CE", "#C9A84C", "#E8B4B8", "#B87333"] },
];

const JEWELRY = [
  { name: "Layered Necklace Stack", desc: "Choker + medium + rani haar. The 2026 bridal formula. Three layers, one statement." },
  { name: "Polki + Emerald", desc: "Uncut diamond with deep green stones. The #1 combination this year. Heritage meets drama." },
  { name: "Oversized Jhumkas", desc: "Replacing smaller earrings as the focal point. Chandbali (crescent moon) shapes are back." },
  { name: "Mathapatti", desc: "Forehead chain jewelry making a strong comeback. Bolder, more elaborate drops than before." },
  { name: "Oversized Nath", desc: "Nose ring with chain — the bold statement accessory for fashion-forward brides." },
  { name: "Embroidered Juttis", desc: "Mirror work, zardozi, or thread embroidery. Custom-matched to outfit color." },
];

const SHOPS = [
  { name: "Sabyasachi", url: "https://www.sabyasachi.com", note: "Ultra-luxury direct" },
  { name: "Anita Dongre", url: "https://www.anitadongre.com", note: "Sustainable, 80K+" },
  { name: "Kalki Fashion", url: "https://www.kalkifashion.com", note: "All budgets, widest range" },
  { name: "Pernia's Pop-Up Shop", url: "https://www.perniaspopupshop.com", note: "100+ designers curated" },
  { name: "Aashni + Co", url: "https://aashniandco.com", note: "Premium luxury multi-designer" },
  { name: "WedMeGood Shop", url: "https://www.wedmegood.com", note: "Vetted vendors by city" },
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

export function BrideFashionContent() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl">
        <Image
          src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&h=400&fit=crop"
          alt="Bridal fashion"
          width={1200}
          height={400}
          className="h-48 w-full object-cover brightness-50 sm:h-56"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Bride Fashion 2026
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

      {/* ─── What's NEW in 2026 ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">What Changed in 2026</h2>
        <Card>
          <CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Non-red is now mainstream.</strong> Ivory, pastels, and jewel tones are no longer "bold choices" — they're the new normal.</p>
            <p><strong className="text-foreground">Ombre lehengas.</strong> Two or three colors blending in one outfit. THE silhouette innovation of 2026.</p>
            <p><strong className="text-foreground">Corset blouses.</strong> Boned bodice construction replacing traditional fitted blouses. The blouse is the hero piece now.</p>
            <p><strong className="text-foreground">Heirloom repurposing.</strong> Converting mom's or grandma's wedding saree into a modern lehenga or cape. A genuine trend, not just influencer content.</p>
            <p><strong className="text-foreground">Sheer dupattas.</strong> Tulle, organza, net with minimal embroidery replacing heavy embellished dupattas.</p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ─── Colors ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Trending Colors</h2>
        <div className="space-y-4">
          {COLORS.map((group) => (
            <div key={group.group}>
              <p className="mb-2 text-sm font-medium">{group.group}</p>
              <div className="flex flex-wrap gap-3">
                {group.items.map((name, i) => (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div
                      className="h-10 w-10 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: group.hexes[i] }}
                    />
                    <span className="text-[10px] text-muted-foreground text-center leading-tight w-14">{name}</span>
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
                  <div className="mt-2 flex flex-wrap gap-3">
                    <InstagramLink handle={d.ig} />
                    {"bridalIg" in d && d.bridalIg && (
                      <InstagramLink handle={d.bridalIg} />
                    )}
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

      {/* ─── Jewelry ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Trending Jewelry & Accessories</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {JEWELRY.map((j) => (
            <Card key={j.name}>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-sm">{j.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{j.desc}</p>
              </CardContent>
            </Card>
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
                <p><strong className="text-foreground">Wedding:</strong> Lehenga or saree + full jewelry stack</p>
                <p><strong className="text-foreground">Reception:</strong> Cape lehenga, gown, or pre-draped saree</p>
                <p><strong className="text-foreground">Sangeet:</strong> Sharara set or lighter lehenga, fun colors</p>
                <p><strong className="text-foreground">Mehendi:</strong> Floral print, sharara, or tissue saree</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-sm mb-2">By Budget</h3>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Under 50K:</strong> Kalki Fashion, Mirraw, Frontier Raas</p>
                <p><strong className="text-foreground">50K - 2L:</strong> Anita Dongre, Payal Singhal, Ridhi Mehra</p>
                <p><strong className="text-foreground">2L - 5L:</strong> Tarun Tahiliani, Anamika Khanna, FSP</p>
                <p><strong className="text-foreground">5L+:</strong> Sabyasachi, Manish Malhotra, Rahul Mishra</p>
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
              navigator.share({ title: "Bride Fashion 2026", url });
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
