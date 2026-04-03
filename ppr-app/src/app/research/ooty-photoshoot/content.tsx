"use client";

import { LocationCard } from "@/components/research/location-card";
import { InfoSection } from "@/components/research/info-section";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const LOCATIONS = [
  {
    name: "Botanical Gardens",
    description:
      "22-hectare garden with over 1,000 plant species. Lush green lawns, flower beds, and a 20-million-year-old fossilized tree. Great for romantic, garden-style shots.",
    highlights: ["Flower beds", "Italian garden", "Fern house", "Manicured lawns"],
    permitRequired: true,
    bestTime: "Early morning (7-9 AM) for soft light and fewer crowds",
  },
  {
    name: "Tea Gardens (Tea Factory & Estates)",
    description:
      "Endless rolling hills of tea plantations. The most iconic Ooty backdrop — symmetrical rows of green stretching to the horizon. Stunning at golden hour.",
    highlights: ["Rolling hills", "Golden hour", "Mist shots", "Drone-friendly"],
    permitRequired: false,
    bestTime: "Early morning for mist, golden hour (4-6 PM) for warm light",
  },
  {
    name: "Ooty Lake",
    description:
      "Artificial lake surrounded by eucalyptus trees. Boat rides available. Reflections on the water make for dreamy couple shots.",
    highlights: ["Water reflections", "Boat props", "Eucalyptus backdrop", "Sunset"],
    permitRequired: true,
    bestTime: "Late afternoon for golden reflections on water",
  },
  {
    name: "Pine Forest (Thalakunda)",
    description:
      "Tall pine trees in neat rows creating dramatic leading lines. Light filtering through the canopy creates a moody, cinematic feel.",
    highlights: ["Leading lines", "Dappled light", "Cinematic", "Moody aesthetic"],
    permitRequired: false,
    bestTime: "Midday when sun filters through canopy, or misty mornings",
  },
  {
    name: "Doddabetta Peak",
    description:
      "Highest point in the Nilgiris (2,637m). Panoramic views of the entire range. Can be windy — plan outfits accordingly.",
    highlights: ["Panoramic views", "Cloud level", "Dramatic sky", "Elevation"],
    permitRequired: false,
    bestTime: "Early morning before clouds roll in (7-9 AM)",
  },
  {
    name: "Pykara Falls & Lake",
    description:
      "Cascading waterfall surrounded by dense shola forest. ~20km from Ooty town. Less crowded than main spots. Stunning during post-monsoon.",
    highlights: ["Waterfall backdrop", "Less crowded", "Forest setting", "Raw nature"],
    permitRequired: true,
    bestTime: "Morning for best waterfall light and fewer tourists",
  },
  {
    name: "Rose Garden",
    description:
      "Over 20,000 varieties of roses across terraced lawns. Vibrant colors year-round. Perfect for close-up couple portraits with flower backgrounds.",
    highlights: ["Vibrant colors", "Terraced layout", "Rose varieties", "Intimate shots"],
    permitRequired: true,
    bestTime: "Morning (8-10 AM) when roses are freshest",
  },
  {
    name: "9th Mile Shooting Point",
    description:
      "A Bollywood-famous scenic viewpoint on the Ooty-Gudalur road. Vast valley views with layered mountain ranges. Ideal for wide-angle dramatic shots.",
    highlights: ["Valley views", "Bollywood location", "Wide-angle", "Mountain layers"],
    permitRequired: false,
    bestTime: "Morning golden hour or late afternoon",
  },
];

const PHOTOGRAPHERS = [
  { name: "Infinite Memories (Coimbatore)", range: "₹30K – ₹1L", notes: "Local to the region, know Ooty intimately. Budget-friendly." },
  { name: "Art Pickle (Bangalore)", range: "₹75K – ₹2L", notes: "Contemporary, candid style. Active in Ooty." },
  { name: "Knotting Bells (Bangalore)", range: "₹1L – ₹3L", notes: "South India destination pre-wedding specialists." },
  { name: "Mystic Studios (Chennai)", range: "₹1L – ₹3L", notes: "Cinematic pre-wedding films, Nilgiris regular." },
  { name: "Potok's World Photography (Chennai)", range: "₹1.5L – ₹4L", notes: "Fine art, editorial style. Landscape-centric shoots." },
  { name: "The Wedding Filmer (Mumbai)", range: "₹5L+", notes: "Premium cinematic. Shot extensively in Ooty/Nilgiris." },
];

const TIMELINE = [
  { when: "Jan 2026", what: "Shortlist & book photographer. Start permit applications." },
  { when: "Feb 2026", what: "Finalize shoot dates (late March or early April). Book hotel. Plan outfits." },
  { when: "Mar 2026", what: "Confirm permits. Video call with photographer for mood board & schedule." },
  { when: "Mar/Apr 2026", what: "Shoot! Arrive day before, shoot 1-2 full days, depart." },
  { when: "Apr-May 2026", what: "Receive edited photos/video (4-6 weeks). Use for invites & social media." },
];

export function OotyResearchContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Pre-Wedding Photoshoot in Ooty
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Research for July 2026 wedding — best locations, timing, costs, and logistics
        </p>
      </div>

      <Separator />

      {/* When to go */}
      <InfoSection title="When to Go">
        <div className="space-y-2">
          <p>
            <strong>Best months:</strong> February – May (before monsoon). Clear skies,
            pleasant 15-25°C, ideal light.
          </p>
          <p>
            <strong>Avoid:</strong> June – September (southwest monsoon — heavy rain, fog,
            slippery trails). October-November can work but is unpredictable.
          </p>
          <p>
            <strong>Recommendation for July wedding:</strong> Shoot in{" "}
            <Badge variant="default" className="text-xs">April or May 2026</Badge> — gives
            2-3 months for editing and album printing.
          </p>
          <p>
            <strong>Duration:</strong> Plan 2-3 days. Day 1: arrive + scout. Day 2: main
            shoot (sunrise to sunset, 4-6 locations). Day 3: buffer/extra shots.
          </p>
        </div>
      </InfoSection>

      {/* Locations */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Top Locations</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {LOCATIONS.map((loc) => (
            <LocationCard key={loc.name} {...loc} />
          ))}
        </div>
      </div>

      <Separator />

      {/* Cost Estimates */}
      <InfoSection title="Cost Estimates">
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Photographer Rates</h4>
          <div className="space-y-2">
            {PHOTOGRAPHERS.map((p) => (
              <div key={p.name} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground text-sm">{p.name}</span>
                  <Badge variant="outline">{p.range}</Badge>
                </div>
                <p className="mt-1 text-xs">{p.notes}</p>
              </div>
            ))}
          </div>

          <h4 className="font-medium text-foreground mt-4">Other Costs</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Travel (Bangalore → Ooty by car): ~₹5,000-8,000 roundtrip fuel/tolls (6-7 hrs drive)</li>
            <li>Stay: ₹2,000-8,000/night (budget to boutique hotel)</li>
            <li>Makeup artist: ₹5,000-15,000 per look</li>
            <li>Location permits: ₹500-2,000 per location (Botanical Gardens, Lake, etc.)</li>
            <li>Drone permit: ₹1,000-3,000 if photographer brings one</li>
            <li><strong>Total budget range: ₹40,000 – ₹2,00,000+</strong> depending on photographer tier</li>
          </ul>
        </div>
      </InfoSection>

      {/* Logistics */}
      <InfoSection title="How to Get There">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>From Bangalore:</strong> 270 km, 6-7 hrs by car via Mysore-Bandipur-Gudalur route. Most scenic option.</li>
          <li><strong>From Coimbatore:</strong> 86 km, 3 hrs by car. Nearest airport (CJB). Flights from all major cities.</li>
          <li><strong>From Chennai:</strong> 560 km, 9-10 hrs by car. Better to fly to Coimbatore.</li>
          <li><strong>Nilgiri Mountain Railway:</strong> UNESCO heritage toy train from Mettupalayam to Ooty. Romantic but slow (5 hrs). Book early — tickets sell out weeks ahead.</li>
        </ul>
      </InfoSection>

      {/* Tips */}
      <InfoSection title="Tips & Gotchas">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Permits:</strong> Botanical Gardens and Ooty Lake require photography permits. Apply 1-2 weeks ahead via Tamil Nadu Horticulture Dept / District Forest Office.</li>
          <li><strong>Wardrobe:</strong> Bring 2-3 outfit changes. Light fabrics that flow in wind work well. Avoid heavy dark colors — they absorb the lush green backdrop.</li>
          <li><strong>Weather backup:</strong> Ooty weather is unpredictable. Keep one indoor location (heritage hotel, café) as plan B.</li>
          <li><strong>Leeches:</strong> If going post-monsoon, leech socks are essential in forest areas (Pine Forest, Pykara).</li>
          <li><strong>Crowd hack:</strong> Weekday shoots are dramatically less crowded than weekends. Tuesday-Thursday is ideal.</li>
          <li><strong>Golden hours:</strong> Sunrise ~6:15 AM, sunset ~6:30 PM. Plan key locations for these windows.</li>
          <li><strong>Find photographers:</strong> Search Instagram #ootyprewedding, #nilgirisprewedding. Check WedMeGood, WeddingWire India, ShaadiSaga filtered by Ooty.</li>
          <li><strong>Outfits:</strong> Deep reds, maroons, mustard, ivory pop against green. Avoid green (you'll blend in) and neon. Flowing fabrics photograph well in the breeze.</li>
          <li><strong>Book early:</strong> Popular photographers book 3-4 months out. Aim to lock in by Jan-Feb 2026.</li>
        </ul>
      </InfoSection>

      {/* Timeline */}
      <InfoSection title="Action Timeline">
        <div className="space-y-2">
          {TIMELINE.map((t) => (
            <div key={t.when} className="flex gap-3 items-baseline">
              <Badge variant="outline" className="shrink-0 text-xs font-mono">
                {t.when}
              </Badge>
              <span>{t.what}</span>
            </div>
          ))}
        </div>
      </InfoSection>

      {/* Action items */}
      <InfoSection title="Decision Checklist">
        <ul className="space-y-2">
          {[
            "Pick shoot dates (April or May 2026)",
            "Choose photographer tier (local / destination / premium)",
            "Shortlist 4-5 locations from list above",
            "Book photographer (2-3 months ahead minimum)",
            "Arrange travel + hotel",
            "Book makeup artist",
            "Apply for location permits",
            "Plan 2-3 outfit sets",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-muted-foreground/30" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
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
