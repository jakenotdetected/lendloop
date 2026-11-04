export type Photo = {
  src: string;
  alt: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
};

const commons = "https://commons.wikimedia.org/wiki/File:";
const by2 = "https://creativecommons.org/licenses/by/2.0/";
const by4 = "https://creativecommons.org/licenses/by/4.0/";
const cc0 = "https://creativecommons.org/publicdomain/zero/1.0/";

export const CATEGORY_PHOTOS: Record<string, Photo> = {
  "power-tools": {
    src: "/photos/power-tools.jpg",
    alt: "A cordless drill resting on gravel",
    title: "Black and Decker Matrix Lithium 20v Cordless Drill",
    author: "Tony Webster",
    license: "CC BY 2.0",
    licenseUrl: by2,
    source: `${commons}Black_and_Decker_Matrix_Lithium_20v_Cordless_Drill_(41159305895).jpg`,
  },
  "hand-tools": {
    src: "/photos/hand-tools.jpg",
    alt: "A hand tool set laid out on a white surface",
    title: "Hand-tool set with bits and accessories",
    author: "Wilfredor",
    license: "CC0",
    licenseUrl: cc0,
    source: `${commons}Hand-tool_set_with_bits_and_accessories_arranged_on_a_white_surface..jpg`,
  },
  garden: {
    src: "/photos/garden.jpg",
    alt: "Rakes and hoes hanging on a weathered wooden wall",
    title: "Garden tools rack (i)",
    author: "Dereckson",
    license: "CC BY 4.0",
    licenseUrl: by4,
    source: `${commons}Garden_tools_rack_(i).jpg`,
  },
  kitchen: {
    src: "/photos/kitchen.jpg",
    alt: "A white stand mixer on a kitchen counter",
    title: "White KitchenAid mixer (KSM150PSWH)",
    author: "Your Best Digs",
    license: "CC BY 2.0",
    licenseUrl: by2,
    source: `${commons}White_KitchenAid_mixer_(KSM150PSWH).jpg`,
  },
  camping: {
    src: "/photos/camping.jpg",
    alt: "A small tent pitched on grass beside a backpack",
    title: "Tent, sleeping bag, and backpack",
    author: "Steve Bittinger",
    license: "CC BY 2.0",
    licenseUrl: by2,
    source: `${commons}Tent,_sleeping_bag,_and_backpack.jpg`,
  },
  cleaning: {
    src: "/photos/cleaning.jpg",
    alt: "A cordless vacuum cleaner lying on a table",
    title: "Cordless vacuum cleaner in the kitchen closeup",
    author: "Shixart1985",
    license: "CC BY 2.0",
    licenseUrl: by2,
    source: `${commons}Cordless_vacuum_cleaner_in_the_kitchen_closeup.jpg`,
  },
  other: {
    src: "/photos/other.jpg",
    alt: "An old wooden toolbox with a chisel and spokeshave",
    title: "Toolbox",
    author: "Jim Griffin",
    license: "CC0",
    licenseUrl: cc0,
    source: `${commons}Toolbox_(49985663631).jpg`,
  },
};

export const WORKSHOP_PHOTO: Photo = {
  src: "/photos/workshop.jpg",
  alt: "Someone reaching for a tool on a red workshop wall",
  title: "Man pointing at tools on a wall in a workshop",
  author: "Shixart1985",
  license: "CC BY 2.0",
  licenseUrl: by2,
  source: `${commons}Man_pointing_at_tools_on_a_wall_in_a_workshop.jpg`,
};

const by3 = "https://creativecommons.org/licenses/by/3.0/";
const bySa2 = "https://creativecommons.org/licenses/by-sa/2.0/";
const bySa3 = "https://creativecommons.org/licenses/by-sa/3.0/";
const bySa4 = "https://creativecommons.org/licenses/by-sa/4.0/";

export const DEMO_PHOTOS: Photo[] = [
  {
    src: "/photos/demo/cordless-drill.jpg",
    alt: "An orange cordless drill",
    title: "Cordless Drill",
    author: "HomeSpot HQ",
    license: "CC BY 2.0",
    licenseUrl: by2,
    source: `${commons}Cordless_Drill_(8559707469).jpg`,
  },
  {
    src: "/photos/demo/extension-ladder.jpg",
    alt: "An aluminium extension ladder leaning against a garage",
    title: "Extension ladder leaning against a garage",
    author: "MarkTraceur",
    license: "CC BY-SA 4.0",
    licenseUrl: bySa4,
    source: `${commons}Extension_ladder_leaning_against_a_garage.JPG`,
  },
  {
    src: "/photos/demo/hedge-trimmer.jpg",
    alt: "Someone trimming a hedge with a cordless hedge trimmer",
    title: "Cordless electric hedge trimmer",
    author: "Mark Hunter",
    license: "CC BY 2.0",
    licenseUrl: by2,
    source: `${commons}Cordless_electric_hedge_trimmer_2.jpg`,
  },
  {
    src: "/photos/demo/stand-mixer.jpg",
    alt: "A red stand mixer on a wooden sideboard",
    title: "Red KitchenAid Artisan",
    author: "BenFrantzDale",
    license: "CC BY-SA 2.0",
    licenseUrl: bySa2,
    source: `${commons}Red_KitchenAid_Artisan.jpg`,
  },
  {
    src: "/photos/demo/tent.jpg",
    alt: "A blue dome tent pitched on a tarp in the woods",
    title: "Camping tent on tarp",
    author: "Eden Aviv",
    license: "CC0",
    licenseUrl: cc0,
    source: `${commons}Camping_tent_on_tarp.jpg`,
  },
  {
    src: "/photos/demo/carpet-cleaner.jpg",
    alt: "A portable carpet spot cleaner with its hose and nozzle",
    title: "Bissell spot clean pro",
    author: "Artoria2e5",
    license: "CC BY 3.0",
    licenseUrl: by3,
    source: `${commons}Bissell_spot_clean_pro.jpg`,
  },
  {
    src: "/photos/demo/pressure-washer.jpg",
    alt: "A red upright pressure washer",
    title: "Sealey PC2952 Pressure Washer",
    author: "Mark Hunter",
    license: "CC BY 2.0",
    licenseUrl: by2,
    source: `${commons}Sealey_PC2952_Pressure_Washer_(4295125564).jpg`,
  },
  {
    src: "/photos/demo/circular-saw.jpg",
    alt: "A circular saw cutting through a wooden board",
    title: "DeWalt circular saw in use",
    author: "simplicity hunter",
    license: "CC BY 2.0",
    licenseUrl: by2,
    source: `${commons}DeWalt_circular_saw_in_use.jpg`,
  },
  {
    src: "/photos/demo/camping-chair.jpg",
    alt: "A green folding camping chair on a lawn",
    title: "Camping chair",
    author: "Ocdp",
    license: "CC0",
    licenseUrl: cc0,
    source: `${commons}Camping-Chair_001.jpg`,
  },
  {
    src: "/photos/demo/sewing-machine.jpg",
    alt: "A black vintage sewing machine with gold decoration",
    title: "Vesta sewing machine",
    author: "Nikodem Nijaki",
    license: "CC BY-SA 3.0",
    licenseUrl: bySa3,
    source: `${commons}Vesta_sewing_machine_IMGP0718.jpg`,
  },
];

export function categoryPhoto(category: string): Photo {
  return CATEGORY_PHOTOS[category] ?? CATEGORY_PHOTOS.other;
}

export const ALL_PHOTOS: Photo[] = [...Object.values(CATEGORY_PHOTOS), WORKSHOP_PHOTO, ...DEMO_PHOTOS];
