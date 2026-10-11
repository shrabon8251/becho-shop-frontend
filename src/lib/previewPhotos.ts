/**
 * Real product photos (Unsplash) per niche for theme demos.
 * Falls back to the SVG art in demoArt.ts if a photo fails to load.
 * URLs use images.unsplash.com with sizing params (reliable hotlink).
 */
const U = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

export const NICHE_PHOTOS: Record<string, string[]> = {
  fashion: [
    U("photo-1441986300917-64674bd600d8"), // clothing rack
    U("photo-1445205170230-053b83016050"), // fashion clothes
    U("photo-1434389677669-e08b4cac3105"), // hanging clothes
    U("photo-1483985988355-763728e1935b"), // shopping fashion
    U("photo-1490481651871-ab68de25d43d"), // fashion style
    U("photo-1487222477894-8943e31ef7b2"), // jeans
    U("photo-1529139574466-a303027c1d8b"), // woman fashion
    U("photo-1515886657613-9f3515b0c78f"), // fashion model
  ],
  food: [
    U("photo-1504674900247-0877df9cc836"), // food plate
    U("photo-1565299624946-b28f40a0ae38"), // pizza
    U("photo-1568901346375-23c9450c58d7"), // burger
    U("photo-1550547660-d9450f859349"), // burger meal
    U("photo-1565958011703-44f9829ba187"), // dessert
    U("photo-1546069901-ba9599a7e63c"), // salad bowl
    U("photo-1567620905732-2d1ec7ab7445"), // pancakes
    U("photo-1540189549336-e6e99c3679fe"), // healthy food
  ],
  furniture: [
    U("photo-1555041469-a586c61ea9bc"), // sofa
    U("photo-1586023492125-27b2c045efd7"), // chair room
    U("photo-1592078615290-033ee584e267"), // armchair
    U("photo-1538688525198-9b88f6f53126"), // desk table
    U("photo-1506439773649-6e0eb8cfb237"), // furniture
    U("photo-1493663284031-b7e3aefcae8e"), // lamp interior
    U("photo-1524758631624-e2822e304c36"), // wooden table
    U("photo-1567016432779-094069958ea5"), // bedroom
  ],
  gadget: [
    U("photo-1505740420928-5e560c06d30e"), // headphones
    U("photo-1523275335684-37898b6baf30"), // watch
    U("photo-1546868871-7041f2a55e12"), // smartwatch
    U("photo-1583394838336-acd977736f90"), // headphones red
    U("photo-1608043152269-423dbba4e7e1"), // earbuds
    U("photo-1590658268037-6bf12165a8df"), // earphones
    U("photo-1601784551446-20c9e07cdbdb"), // phone
    U("photo-1526170375885-4d8ecf77b99f"), // camera
  ],
  beauty: [
    U("photo-1596462502278-27bfdc403348"), // cosmetics
    U("photo-1571781926291-c477ebfd024b"), // skincare
    U("photo-1522335789203-aabd1fc54bc9"), // makeup
    U("photo-1596704017254-9b121068fb31"), // cream
    U("photo-1570172619644-dfd03ed5d881"), // serum
    U("photo-1586495777744-4413f21062fa"), // lipstick
    U("photo-1598440947619-2c35fc9aa908"), // perfume
    U("photo-1620916566398-39f1143ab7be"), // skincare bottle
  ],
  jewel: [
    U("photo-1515562141207-7a88fb7ce338"), // ring
    U("photo-1605100804763-247f67b3557e"), // ring box
    U("photo-1611591437281-460bfbe1220a"), // gold rings
    U("photo-1602173574767-37ac01994b2a"), // jewelry
    U("photo-1599643478518-a784e5dc4c8f"), // necklace
    U("photo-1617038220319-276d3cfab638"), // earrings
    U("photo-1601121141461-9d6647bca1e2"), // bracelet
    U("photo-1611652022419-a9419f74343d"), // gold jewelry
  ],
  kids: [
    U("photo-1558060370-d644479cb6f7"), // toys
    U("photo-1596461404969-9ae70f2830c1"), // toy car
    U("photo-1566576912321-d58ddd7a6088"), // teddy bear
    U("photo-1519689680058-324335c77eba"), // baby toys
    U("photo-1587654780291-39c9404d746b"), // kids blocks
    U("photo-1500995617113-50f535d0d05b"), // toy
    U("photo-1545558014-8692077e9b5c"), // kids
    U("photo-1566140967404-b8b3932483f5"), // toy blocks
  ],
  organic: [
    U("photo-1542838132-92c53300491e"), // vegetables
    U("photo-1466637574441-749b8f19452f"), // cooking ingredients
    U("photo-1498837167922-ddd27525d352"), // vegetables
    U("photo-1500937386664-56d1dfef3854"), // farm produce
    U("photo-1464226184884-fa280b87c399"), // green farm
    U("photo-1471193945509-9ad0617afabf"), // vegetables market
    U("photo-1490645935967-10de6ba17061"), // healthy food
    U("photo-1518843875459-f738682238a6"), // greens
  ],
  pharma: [
    U("photo-1584308666744-24d5c474f2ae"), // medicine
    U("photo-1471864190281-a93a307b6dede"), // pills
    U("photo-1587854692152-cbe660dbde88"), // medicine bottle
    U("photo-1631549916768-dd62c9b61011"), // pills
    U("photo-1607619056574-7b8d3ee536b2"), // medicine
    U("photo-1550572017-edd951b55104"), // pharmacy
    U("photo-1585435557343-3b092031a16"), // pills bottle
    U("photo-1559757148-5c350d0d3c56"), // medicine
  ],
  sport: [
    U("photo-1461896836934-ffe607ba8211"), // sports
    U("photo-1517649763962-0c623066013b"), // cycling
    U("photo-1542291026-7eec264c27ff"), // sneaker red
    U("photo-1546519638-68e109498ffc"), // basketball
    U("photo-1571019613454-1cb2f99b2d8b"), // fitness
    U("photo-1518310383802-640c2de311b2"), // gym
    U("photo-1552674605-db6ffd4facb5"), // running
    U("photo-1535131749006-b7f58c99034b"), // dumbbell
  ],
  lifestyle: [
    U("photo-1523275335684-37898b6baf30"), // watch
    U("photo-1542291026-7eec264c27ff"), // sneakers
    U("photo-1553062407-98eeb64c6a62"), // backpack
    U("photo-1572635196237-14b3f281503f"), // sunglasses
    U("photo-1491553895911-0055eca6402d"), // sneaker
    U("photo-1503602642458-232111445657"), // white mug
    U("photo-1524805444758-089113d48a6d"), // watch wrist
    U("photo-1585386959984-a4155224a1ad"), // perfume bottle
  ],
};

/** Hero photos per niche for theme demos. */
export const NICHE_HERO: Record<string, string> = {
  fashion: U("photo-1441986300917-64674bd600d8"),
  food: U("photo-1504674900247-0877df9cc836"),
  furniture: U("photo-1555041469-a586c61ea9bc"),
  gadget: U("photo-1498049794561-7780e7231661"),
  beauty: U("photo-1596462502278-27bfdc403348"),
  jewel: U("photo-1515562141207-7a88fb7ce338"),
  kids: U("photo-1558060370-d644479cb6f7"),
  organic: U("photo-1542838132-92c53300491e"),
  pharma: U("photo-1584308666744-24d5c474f2ae"),
  sport: U("photo-1461896836934-ffe607ba8211"),
  lifestyle: U("photo-1441984904996-e0b6ba687e04"),
};

/** Get a photo for a niche + index (cycles through the list). */
export function nichePhoto(niche: string, index = 0): string | null {
  const arr = NICHE_PHOTOS[niche];
  if (!arr?.length) return null;
  return arr[index % arr.length];
}
