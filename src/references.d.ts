declare module gon {
  export interface SuggestedLabelColors {
    '#0033CC': string;
    '#428BCA': string;
    '#44AD8E': string;
    '#A8D695': string;
    '#5CB85C': string;
    '#69D100': string;
    '#004E00': string;
    '#34495E': string;
    '#7F8C8D': string;
    '#A295D6': string;
    '#5843AD': string;
    '#8E44AD': string;
    '#FFECDB': string;
    '#AD4363': string;
    '#D10069': string;
    '#CC0033': string;
    '#FF0000': string;
    '#D9534F': string;
    '#D1D100': string;
    '#F0AD4E': string;
    '#AD8D43': string;
  }

  export interface Features {
    suppressAjaxNavigationErrors: boolean;
    gfmGrafanaIntegration: boolean;
  }

  export interface GonStatic {
    api_version: string;
    default_avatar_url: string;
    max_file_size: number;
    asset_host?: any;
    webpack_public_path: string;
    relative_url_root: string;
    shortcuts_path: string;
    user_color_scheme: string;
    gitlab_url: string;
    revision: string;
    gitlab_logo: string;
    sprite_icons: string;
    sprite_file_icons: string;
    emoji_sprites_css_path: string;
    test_env: boolean;
    suggested_label_colors: SuggestedLabelColors;
    first_day_of_week: number;
    ee: boolean;
    current_user_id: number;
    current_username: string;
    current_user_fullname: string;
    current_user_avatar_url: string;
    features: Features;
  }
}

declare var gon: gon.GonStatic;

interface Window {
  gon: gon.GonStatic;
}
