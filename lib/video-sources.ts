// Where every tool clip comes from (#521). A demo video has one copy, in its
// project's repository under `media/demo/`, with the recipe that remakes it;
// `deno task pull:videos` copies the files below from that repository at the
// pinned commit into `static/video/tools/<slug>/`. To take a newer clip, change
// the commit and run the task (docs/images.md "Videos").

/** One set of files pulled from one repository at one commit. */
export interface VideoSource {
  /** The folder under `static/video/tools/`: the tool's slug. */
  slug: string
  /** The repository under github.com/spy4x. */
  repo: string
  /** The full 40-character commit the files are read at. */
  commit: string
  /** Each local file name in the slug's folder, mapped to its path in the repository. */
  files: Readonly<Record<string, string>>
}

/** The files of a clip in its repository's `media/demo/`, under the same names here. */
export const DEMO_FILES = [
  "demo.webm",
  "demo.mp4",
  "poster.webp",
  "poster-640.webp",
  "captions.vtt",
] as const

function demo(slug: string, commit: string, repo = slug): VideoSource {
  return {
    slug,
    repo,
    commit,
    files: Object.fromEntries(DEMO_FILES.map((f) => [f, `media/demo/${f}`])),
  }
}

/** Every pulled clip, and Seed's admin panel video. */
export const VIDEO_SOURCES: readonly VideoSource[] = [
  demo("mig", "90f50f33f6785efecf1d2fe8994546281866010f"),
  demo("oko", "d93c6b329fcd47d4a9bef91533fdbe0c52f45cf1"),
  demo("zond", "7744aaab8e64f31379bda47626aeaeaee911ecd5"),
  demo("caldav-mcp", "54b014cd5306aa11824f085a7cd07141d55cb259"),
  demo("caldav-tasks-web", "8f13fae44eb5450ba28c0a40876e6f776770b651"),
  demo("preact-components", "3a58c15a05d1aa6c293587b77d7bea1213b2772d"),
  demo("rostok", "892f7057b71e6b7bdb7f167863a896db818c6ae1"),
  demo("ts-libs", "d58a2176f21c78a366aa13dfd837aefe5405362b"),
  demo("dotfiles", "435f9df29e506a555cd3c48e178fa460aac20376"),
  demo("seed", "3a14e887ed99f2a269a5b9554d884fa537a16278"),
  {
    slug: "seed",
    repo: "seed",
    commit: "54a1e821f52588c5b105a063a71399f93501cfee",
    files: {
      "admin-panel.webm": "apps/mpa/media/video/admin-panel.webm",
      "admin-panel.mp4": "apps/mpa/media/video/admin-panel.mp4",
      "admin-panel-poster-1280.webp":
        "apps/mpa/static/video/admin-panel-poster-1280.webp",
      "admin-panel-poster-1920.webp":
        "apps/mpa/static/video/admin-panel-poster-1920.webp",
    },
  },
]

/** The raw URL of one file of a source. */
export function rawUrl(source: VideoSource, path: string): string {
  return `https://raw.githubusercontent.com/spy4x/${source.repo}/${source.commit}/${path}`
}
