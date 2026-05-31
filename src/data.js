const beadUrl = (name) => new URL(`./assets/beads/${name}.png`, import.meta.url).href;

export const hardwareColors = [
  { id: "pink", name: "Powder Pink", value: "#f6a8c4", finish: "matte" },
  { id: "gold", name: "Shiny Gold", value: "#d4a847", finish: "metal" },
  { id: "lime", name: "Lime Pop", value: "#b7ef78", finish: "matte" },
  { id: "magenta", name: "Hot Magenta", value: "#d91c77", finish: "matte" },
  { id: "sky", name: "Baby Blue", value: "#9ed6f1", finish: "matte" },
  { id: "mint", name: "Mint", value: "#62d0ac", finish: "matte" },
  { id: "white", name: "Milk White", value: "#f4f1ea", finish: "matte" },
  { id: "cobalt", name: "Cobalt", value: "#1734b7", finish: "matte" },
  { id: "lavender", name: "Lilac", value: "#c9adef", finish: "matte" },
  { id: "black", name: "Soft Black", value: "#171d21", finish: "matte" },
  { id: "silver", name: "Shiny Silver", value: "#c7c9c4", finish: "metal" },
  { id: "orange", name: "Orange", value: "#f47b2b", finish: "matte" },
  { id: "yellow", name: "Sunny Yellow", value: "#f4cc25", finish: "matte" },
  { id: "tan", name: "Taupe Tan", value: "#bca98d", finish: "matte" },
  { id: "brown", name: "Cocoa", value: "#8b523c", finish: "matte" },
  { id: "red", name: "Cherry Red", value: "#e82427", finish: "matte" },
];

export const cordColors = [
  { id: "black-olive", name: "Black Olive", value: "#20251d", accent: "#707768" },
  { id: "orange", name: "Signal Orange", value: "#e55420", accent: "#ff9b42" },
  { id: "hot-pink", name: "Hot Pink", value: "#c41468", accent: "#ff70aa" },
  { id: "silver-gray", name: "Silver Gray", value: "#8b9892", accent: "#d5ddd8" },
  { id: "cream", name: "Cream", value: "#dfcab1", accent: "#fff0dc" },
  { id: "purple", name: "Purple", value: "#4d3579", accent: "#a980db" },
  { id: "neon-green", name: "Neon Green", value: "#64df1f", accent: "#b6ff70" },
  { id: "dark-teal", name: "Dark Teal", value: "#0b3b36", accent: "#447b72" },
  { id: "red", name: "Red", value: "#df1518", accent: "#ff6a54" },
  { id: "yellow", name: "Yellow", value: "#e7c408", accent: "#ffe95b" },
  { id: "aqua", name: "Aqua", value: "#26c8ce", accent: "#a0fbff" },
  { id: "blue", name: "Blue", value: "#153f9e", accent: "#6a90ff" },
  { id: "pale-pink", name: "Pale Pink", value: "#dca4bb", accent: "#ffd4e4" },
  { id: "teal", name: "Teal", value: "#009b7b", accent: "#5ff0cf" },
];

export const beads = [
  { id: "star-mint-speckle", name: "Mint Speckle Star", shape: "star", src: beadUrl("star-mint-speckle"), suggestedUse: "strand,charm" },
  { id: "star-indigo-glaze", name: "Indigo Glaze Star", shape: "star", src: beadUrl("star-indigo-glaze"), suggestedUse: "strand,charm" },
  { id: "star-honey-brown", name: "Honey Brown Star", shape: "star", src: beadUrl("star-honey-brown"), suggestedUse: "strand,charm" },
  { id: "star-sun-yellow", name: "Sun Yellow Star", shape: "star", src: beadUrl("star-sun-yellow"), suggestedUse: "strand,charm" },
  { id: "star-coral-red", name: "Coral Red Star", shape: "star", src: beadUrl("star-coral-red"), suggestedUse: "strand,charm" },
  { id: "star-sky-blue", name: "Sky Blue Star", shape: "star", src: beadUrl("star-sky-blue"), suggestedUse: "strand,charm" },
  { id: "star-teal-speckle", name: "Teal Speckle Star", shape: "star", src: beadUrl("star-teal-speckle"), suggestedUse: "strand,charm" },
  { id: "round-cream-swirl", name: "Cream Swirl Round", shape: "round", src: beadUrl("round-cream-swirl"), suggestedUse: "strand" },
  { id: "round-tortoise-cream", name: "Tortoise Cream Round", shape: "round", src: beadUrl("round-tortoise-cream"), suggestedUse: "strand" },
  { id: "round-aqua-cloud", name: "Aqua Cloud Round", shape: "round", src: beadUrl("round-aqua-cloud"), suggestedUse: "strand" },
  { id: "round-pink-milk", name: "Pink Milk Round", shape: "round", src: beadUrl("round-pink-milk"), suggestedUse: "strand" },
  { id: "round-teal-caramel", name: "Teal Caramel Round", shape: "round", src: beadUrl("round-teal-caramel"), suggestedUse: "strand" },
  { id: "cube-pink-splash", name: "Pink Splash Cube", shape: "cube", src: beadUrl("cube-pink-splash"), suggestedUse: "strand" },
  { id: "cube-ivory-teal-red", name: "Ivory Teal Cube", shape: "cube", src: beadUrl("cube-ivory-teal-red"), suggestedUse: "strand" },
  { id: "cube-blue-black", name: "Blue Black Cube", shape: "cube", src: beadUrl("cube-blue-black"), suggestedUse: "strand" },
  { id: "cube-olive-gloss", name: "Olive Gloss Cube", shape: "cube", src: beadUrl("cube-olive-gloss"), suggestedUse: "strand" },
  { id: "barrel-cream-stripe", name: "Cream Stripe Barrel", shape: "barrel", src: beadUrl("barrel-cream-stripe"), suggestedUse: "strand" },
  { id: "barrel-teal-cream", name: "Teal Cream Barrel", shape: "barrel", src: beadUrl("barrel-teal-cream"), suggestedUse: "strand" },
  { id: "diamond-green-cream", name: "Green Cream Diamond", shape: "diamond", src: beadUrl("diamond-green-cream"), suggestedUse: "strand" },
  { id: "diamond-sky-cream", name: "Sky Cream Diamond", shape: "diamond", src: beadUrl("diamond-sky-cream"), suggestedUse: "strand" },
];

export const defaultDesign = {
  hardwareType: "round",
  hardwareColor: "gold",
  cordColor: "red",
  beads: [
    { id: "star-mint-speckle", key: "starter-1" },
    { id: "round-cream-swirl", key: "starter-2" },
    { id: "cube-pink-splash", key: "starter-3" },
    { id: "star-indigo-glaze", key: "starter-4" },
  ],
  charm: { beadId: "star-sun-yellow", attachmentPoint: "lowerLoop" },
};
