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

export function categoryPhoto(category: string): Photo {
  return CATEGORY_PHOTOS[category] ?? CATEGORY_PHOTOS.other;
}

export const ALL_PHOTOS: Photo[] = [...Object.values(CATEGORY_PHOTOS), WORKSHOP_PHOTO];
