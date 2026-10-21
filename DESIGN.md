---
name: "IMO Studio · Liquid Desk 3.1"
description: "An open offline voyage desk with source-derived glass and simple appearance choices."
colors:
  primary: "#005fc5"
  accent-teal: "#006f64"
  accent-violet: "#7140bc"
  ink: "#172c42"
  muted: "#405a70"
  line: "#627e962b"
  canvas: "#b8d4e2"
  paper: "#f5faffd9"
  chrome: "#ffffff35"
  hover: "#e2f1fa"
  selected: "#e4f0fe"
  field: "#ffffffa6"
  table: "#f8fcfff0"
  thead: "#eaf3f9f5"
  focus: "color-mix(in srgb,var(--blue),white 20%)"
  accent-ink: "color-mix(in srgb,var(--blue),#142c42 14%)"
  accent-surface: "color-mix(in srgb,var(--blue),white 87%)"
  dock-active: "#ffffff5e"
  secondary-ground: "#ffffff6b"
  glass-fill: "#ffffff18"
  glass-inner: "#ffffff40"
  glass-soft-fill: "#ffffff79"
  glass-soft-inner: "#ffffff38"
  library-ground: "color-mix(in srgb,var(--paper),transparent 17%)"
  surface-clear: "#f1f7fc"
  author: "#415c73"
  danger: "#a12e45"
  success-ground: "#d6eee5"
  success-ink: "#195d49"
  warning-ground: "#fff1d6"
  warning-ink: "#7e4b00"
  error-ground: "#ffe2e7"
  error-ink: "#9a2940"
  dark-ink: "#e9f3fe"
  dark-muted: "#b6cadd"
  dark-line: "#c7dfee2b"
  dark-canvas: "#16293e"
  dark-paper: "#1a2b3de8"
  dark-chrome: "#20436659"
  dark-hover: "#38516a"
  dark-selected: "#2b4c71"
  dark-field: "#233b54d9"
  dark-table: "#1c3145f5"
  dark-thead: "#263f56f7"
  dark-focus: "color-mix(in srgb,var(--blue),white 63%)"
  dark-accent-ink: "color-mix(in srgb,var(--blue),white 60%)"
  dark-accent-surface: "color-mix(in srgb,var(--blue),#203548 79%)"
  dark-dock-active: "#bfdcff26"
  dark-secondary-ground: "#bedaff18"
  dark-glass-fill: "#accbff13"
  dark-glass-inner: "#cbe6ff30"
  dark-glass-soft-fill: "#2c49619c"
  dark-library-ground: "#203a51ce"
  dark-surface-clear: "#22374d"
  dark-author: "#aec6dc"
  dark-danger: "#ffb6c1"
  dark-success-ground: "#244c41"
  dark-success-ink: "#c1edda"
  dark-warning-ground: "#55422b"
  dark-warning-ink: "#ffe3b3"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif"
    fontSize: "4.35rem"
    fontWeight: 620
    lineHeight: 1.22
    letterSpacing: "-.04em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif"
    fontSize: "2rem"
    fontWeight: 640
    lineHeight: 1.25
    letterSpacing: "-.035em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif"
    fontSize: "1.22rem"
    fontWeight: 620
    lineHeight: 1.4
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif"
    fontSize: ".9rem"
    fontWeight: 400
  navigation:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif"
    fontSize: ".8rem"
    fontWeight: 400
    lineHeight: 1.35
  dock:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif"
    fontSize: ".68rem"
    fontWeight: 400
    lineHeight: 1.2
  metadata:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif"
    fontSize: ".72rem"
    fontWeight: 400
    lineHeight: 1.6
  author:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif"
    fontSize: ".61rem"
    fontWeight: 400
    lineHeight: 1.55
  table-data:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif"
    fontSize: "12px"
    fontWeight: 400
  code:
    fontFamily: "ui-monospace, Consolas, monospace"
    fontSize: "11px"
    lineHeight: 1.4
rounded:
  table-field: "7px"
  badge: "8px"
  field: "12px"
  table: "13px"
  tile: "15px"
  surface: "16px"
  control: "18px"
  port: "20px"
  dock-selection: "23px"
  route: "26px"
  editor: "29px"
  dock: "30px"
  library: "30px"
  welcome: "38px"
  moderate-field: "8px"
  moderate-control: "12px"
  moderate-surface: "17px"
  moderate-lens: "20px"
  moderate-welcome: "23px"
spacing:
  tight: "5px"
  small: "8px"
  control-gap: "10px"
  standard: "15px"
  form-gap: "18px"
  surface-inset: "22px"
  heading-gap: "24px"
  desktop-shell: "14px 38px 112px"
  editor-inset: "29px 32px 40px"
  library-inset: "25px 27px 16px"
  mobile-shell: "11px 13px 143px"
  mobile-editor: "23px 18px 32px"
  short-shell: "7px 20px 79px"
  short-mobile-shell: "7px 10px 114px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#fff"
    rounded: "{rounded.control}"
    padding: "8px 15px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.secondary-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 15px"
    height: "36px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "8px 3px"
    height: "36px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "9px 11px"
    height: "38px"
  dock-navigation:
    backgroundColor: "{colors.dock-active}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.dock}"
    rounded: "{rounded.dock-selection}"
    padding: "7px 11px 6px"
    width: "61px"
    height: "55px"
  file-library:
    backgroundColor: "{colors.library-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.library}"
    padding: "{spacing.library-inset}"
    width: "min(880px, calc(100vw - 48px))"
  library-tile:
    backgroundColor: "#ffffff33"
    textColor: "{colors.ink}"
    typography: "{typography.navigation}"
    rounded: "{rounded.tile}"
    padding: "12px 8px"
    height: "79px"
  library-tile-selected:
    backgroundColor: "{colors.dock-active}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.tile}"
  store-filter:
    backgroundColor: "#ffffff50"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
    height: "36px"
  store-filter-selected:
    backgroundColor: "{colors.accent-surface}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
  editing-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.editor}"
    padding: "{spacing.editor-inset}"
    width: "100%"
  port-selected:
    backgroundColor: "{colors.dock-active}"
    textColor: "{colors.ink}"
    rounded: "{rounded.port}"
    padding: "8px 12px"
    width: "155px"
    height: "54px"
  switch:
    backgroundColor: "#69839a4a"
    rounded: "14px"
    padding: "3px"
    width: "34px"
    height: "21px"
  switch-checked:
    backgroundColor: "{colors.primary}"
    width: "34px"
    height: "21px"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.editor}"
    padding: "29px"
    width: "95vw"
  appearance-settings:
    backgroundColor: "#ffffff50"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "23px"
  appearance-select:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.field}"
    padding: "9px 11px"
    height: "38px"
---

# Design System: IMO Studio · Liquid Desk 3.1

## Overview

**Creative North Star: "Liquid Desk"**

Liquid Desk is an open voyage workstation built from convex glass. A compact masthead and detached route capsule sit above a broad editing lens; a floating instrument dock keeps navigation, saving, and generation within reach. The file library appears only when requested. Aqua, periwinkle, and peach water ribbons transmit through opposing inset rims, diagonal highlights, and a soft inner edge. The approved strong-liquid variant adds a double edge and a more transmitting gradient across the navigation, editing, and decision layers.

Version 3.1 refines the committed 3.0 topology in work/liquid-reset-direction.md using the actual yzrt material and simple appearance choices specified in work/yzrt-integration-direction.md. Version 3.2.1 strengthens that material under the explicit follow-up in work/notice-fix-direction.md, without replacing the workstation. The open desk and extreme Liquid Glass identity remain the visual authority. The earlier fixed file outline and minimalism/glass blend are historical anti-reference. The operational hierarchy, Chinese interface, local workflow, ten document templates, and exact workbook output remain product truth.

The visual world is code-led. One local cached Canvas supplies the authored ground; scoped CSS supplies the glass material. The yzrt source, modification attribution, and GPL-2.0 text are preserved in work/reference-yzrt/ and THIRD_PARTY_NOTICES.md. There is no approved image comp. The context/concept-seed launcher and one-time detector invocation were blocked by Windows group policy; no seed key, generated concept card, or detector verdict is claimed. The earlier 17 captures in .impeccable/review/yzrt/ and current 3.2.1 captures in .impeccable/review/prism-321/ and .impeccable/review/flow32/ are interface evidence using synthetic demonstration content, not production records or background assets. They do not establish physical optical refraction, actual Office printing, or untested devices.

**Key Characteristics:**

- An open editing canvas with no permanent sidebar.
- Detached route and instrument lenses, plus an on-demand file library.
- Source-derived CSS rims on navigation, library, and welcome, with the approved strong-liquid treatment on the editor, dialogs, selected lenses, and action controls.
- Authored aqua/periwinkle/peach geometry, optional soft glass, and an opaque clear mode.
- Native operational typography, independent data type, and mobile, dark, short-height, and system-preference treatments.

## Colors

The frontmatter is the normative shared-base inventory extracted from the active source. The approved strong-liquid recipes are conditional material variants, recorded below and in sidecar previews; they do not replace the soft/clear palette or introduce a second accent identity. Clear blue is the working accent; sea-glass, periwinkle, and peach illumination belongs to the authored environment, not to status meaning.

### Primary

- **Working Blue** (primary) identifies the principal action, active port number, and checked switches. Runtime settings assign the active accent through the existing blue property. Accent ink, selected surfaces, and focus derive from that live accent; preserve their light/dark color-mix recipes rather than freezing a blue-only approximation.

### Secondary

- **Deep Teal** (accent-teal) is a user-selected substitute for the working accent, rather than a second simultaneous action color.

### Tertiary

- **Quiet Violet** (accent-violet) is the other supported substitute. The ambient periwinkle field does not automatically make an element selected.

### Neutral

- **Voyage Ink / Context Ink** (ink, muted) establish task and supporting text over the illuminated surfaces.
- **Water Ground / Glass Paper / Transmitting Chrome** (canvas, paper, chrome) establish the environment and broad layers. Glass fill and inner-edge colors belong to the CSS material; gradients remain recipes in source and sidecar snippets rather than color primitives.
- **Field / Table / Table Heading** (field, table, thead) provide progressively steadier grounds for editing and dense reading.
- **Hairline / Focus / Active Lens** (line, focus, dock-active) mark boundaries, keyboard attention, and selected physical thickness.
- **Soft Glass / Clear Surface** (glass-soft-fill, glass-soft-inner, surface-clear) are appearance alternatives. Clear mode and reduced transparency use the same opaque surface role; they preserve readable ink, fields, and tables.
- **Quiet Credit** (author) uses a fixed slate role. Its dark counterpart remains separately authored.
- **Success, Warning, Error, and Danger** preserve semantic feedback. Pair these roles with words, counts, or explicit actions; never use them to color the water field.
- **Dark counterparts** preserve the same hierarchy with deep blue glass, pale ink, restrained illuminated edges, and solid enough table backing. Navigation, location filters, and document icons use the live pale accent ink; the active port text and text links retain their specialized pale inks from the base material sheet.

**The Composited Ink Rule.** Judge small text against the actual illuminated material in both themes. Keep ink and metadata at full opacity; use their dedicated color roles to establish hierarchy.

The sidecar's eight-step color ramps are synthesized inspection aids, not new production tokens. Ramps for derived colors illustrate the default working accent; their canonical color-mix expressions remain normative. Preserve alpha in source colors and judge the material as a composition.

## Typography

The native system UI stack is a deliberate **Operate** choice for offline Windows Chrome/Edge, Chinese and Latin content, and familiar controls. No font download is required. Hierarchy comes from scale, weight, tracking, and space.

- **Display:** the first-use task heading uses the display role. It resolves to approximately (61px) at the default root, then steps to (3.8rem), (3.4rem), and (3.15rem) across the current width breakpoints.
- **Headline:** the exact current document or settings page uses headline. Mobile reduces this to (1.62rem), with a (1.3) line height.
- **Title:** subsection hierarchy uses title; library and dialog headings have an observed larger intermediate role (1.5rem, 600), and the defaults introduction uses (1.55rem).
- **Body / Labels:** ordinary operational prose and fields use body and label. Introductions retain a comfortable measure (75ch) and a looser reading line height (1.85).
- **Navigation / Dock / Metadata:** compact supporting roles keep the large editing plane dominant. Selected library labels use (550). Route name and date remain distinct; short location codes use the code role.
- **Table data:** the independent table-font setting defaults to the frontmatter value. Table headings follow that same setting, with (550) weight; in-cell editors inherit it. Density changes cell padding rather than changing font size.
- **Author:** the fixed credit uses the author role; it adjusts to (.56rem) at the middle width, returns to (.61rem) where it sits above the dock, and becomes (.5rem) on mobile. It remains full opacity.

**The Two Type Controls Rule.** Shell type scales from the user-selected root size; table data keeps its independent pixel setting. Interface styling must never alter the workbook's typography or print layout.

The root defaults to (14px); supported shell sizes are (12px), (14px), (16px), and (18px). Table choices are (11px), (12px), (14px), and (16px). Only short identifiers and literal configuration/code use monospace. Numeric alignment is specifically applied to save time and specialized date/count columns where source declares it.

## Layout

The dimensions below record the incumbent 3.1 base. The 3.2–3.2.2 workflow extensions add scoped operational overrides in flow32.css for normal-height desktop spacing, file controls, voyage switches, and preparation-list management; these do not replace the shared material or token vocabulary.

The shell occupies the viewport (100dvh) and keeps body overflow closed. The main flex column uses desktop-shell padding and standard spacing. Its compact masthead is centered within a (1420px) maximum. The detached route capsule sizes to its contents within a (1100px) maximum; port stops scroll horizontally inside it. The editor fills the remaining height within a (1400px) maximum and owns its vertical overflow.

The working sheet uses editor-inset and the editor radius. It presents one real document heading, a port/context line, contextual actions, then the editor. Ordinary form grids use three columns or an explicit two-column variant, separated by form-gap. Subsections are mostly open groups, disclosures, or thin separators; transparent nested legacy wrappers do not establish another card hierarchy.

The dock is centered at the lower edge (19px) and remains detached from the editing sheet. It groups voyage/files/common data/output separately from more/save/generate. Save status sits at lower left and the fixed author credit at lower right. The on-demand library sits above the dock (109px), is at most (880px) wide, and limits its height to the viewport minus (210px). Search and library content share one internal scrolling region.

- At (1250px) and below, shell side padding becomes (26px), editor padding becomes (26px 28px 35px), and ancillary masthead metrics recede.
- At (1000px) and below, the shell reserves (143px) below content; status and credit move above the dock. Document tiles change from five columns to four, shared data to three, while preparation remains two. Defaults controls move beneath their summaries.
- At (760px) and below, use mobile-shell and mobile-editor. The brand becomes its symbol, the route fills the width, headings compact, forms and advanced options stack, and the editing lens remains independently scrollable. Library document tiles use three columns; shared and preparation groups use two. The library sits above the two-row mobile dock (132px), with a width of the viewport minus (24px).
- The mobile dock keeps four navigation controls in its first row and more/save/generate in the second. Save and generate retain a minimum height of (36px). Status and credit stay directly above it.
- The welcome state is a wide text-and-port-intake composition on desktop and a single flowing column on mobile. Its central canvas is open; the welcome intake is the tall convex lens.
- At a viewport height of (640px) or less, the short-height overrides apply after the width rules. Above (760px) wide, use short-shell padding, an (8px) shell gap, a (53px) route, a (43px) dock item, and editor padding (18px 23px 28px); the library sits (77px) above the lower edge with a viewport-minus-(112px) height limit. At (760px) wide or less, use short-mobile-shell padding, a (54px) route, compact (33px) dock items, (31px) save/generate controls, and editor padding (17px 15px 25px); the library sits (105px) above the lower edge with a viewport-minus-(135px) height limit. The working sheet still owns its scroll area.

Tables scroll within their own wrappers. The ordinary limit is (58vh), mobile is (54vh), inventory groups retain (48vh), and dialog tables use (42vh). Normal cells use (11px 10px); the existing compact and relaxed density settings retain their separate overrides. Wide editable columns must remain inside these wrappers.

**The Open Desk Rule.** Reserve the canvas for the current port and document. The file library is an on-demand popover; route context and the detached dock carry navigation without a permanent sidebar.

Current captures in .impeccable/review/yzrt/ are welcome.png, desktop.png, library.png, defaults.png, stores.png, user-1280.png, mobile.png, mobile-library.png, dark.png, settings.png, settings-glass.png, aurora-soft.png, plain-clear.png, short-landscape.png, short-mobile.png, bulk-ready.png, and bulk-dialog.png. The viewport classes are desktop (1512×1050), actual-user (1280×800), mobile (390×844), short landscape (844×390), and short mobile (390×480). Short captures show the document top rather than an active row edit. These files are evidence of the implemented layout, not a substitute for the source cascade or a blanket claim about untested devices.

## Elevation & Depth

Liquid Glass is the shared material family. A local Canvas draws the aqua/periwinkle/peach ground, two broad geometric water ribbons, their contour bands, and a far-field sheen. The route, instrument dock, file library, and welcome intake use the adapted yzrt CSS material. In 3.2.1, prism_glass.css adds a more transmitting gradient, stronger opposing inset edges, a masked outer rim, and a second inset edge only when glassStyle is liquid and effective transparency is full. Pointer position moves a bounded radial sheen inside those four layers. Soft and clear retain their existing recipes. This is a CSS optical treatment; the active runtime creates no SVG filters, displacement maps, or filter IDs.

With full liquid effects, the editor and dialogs receive their own translucent gradients and the same stronger inset edge; dialogs keep the larger temporary lift and blurred scrim. Selected port/dock lenses receive a compact gradient and opposing-edge depth. Primary and secondary buttons in footer, document, and dialog action rows receive the scoped stronger control treatment. Tables keep dedicated, nearly opaque light/dark grounds; other controls and alternate appearances retain the base family. The upstream demonstration's global contrast filter, disabled text selection, global transitions, and fixed high layer index are not part of the scoped material.

### Shadow Vocabulary

The sidecar preserves the exact base light/dark yzrt edges and depth, soft-mode depth, base selection/sheet/control shadows, and the 3.2.1 prism edge/depth recipes. Full-liquid route, dock, library, and welcome share the prism edge/depth; editor and dialog combine that edge with their own lift. Selected port/dock lenses and action-row controls use the smaller prism treatment. Base and soft recipes remain available outside that condition. Dense internal groups remain flatter.

### Material Roles

These are the active full-transparency liquid-mode recipes after the complete stylesheet cascade; responsive CSS may use smaller visible corners.

| Role | Nominal radius | Blur | Saturation | Edge family |
| --- | ---: | ---: | ---: | --- |
| Route capsule | 26px | 12px | 1.8 | prism double edge |
| Instrument dock | 30px | 12px | 1.8 | prism double edge |
| File library | 30px | 28px | 1.65 | prism double edge, with steadier library gradient |
| Editing sheet | 29px | 22px | 1.45 | prism inset edge |
| Welcome intake | 38px | 12px | 1.8 | prism double edge |
| Selected dock item | 23px | 8px | 1.5 | prism with compact depth |
| Selected port | 20px | 8px | 1.5 | prism with compact depth |
| Dialog | 29px | 30px | 1.65 | prism inset edge |

Soft mode uses blur (16px) on the four yzrt layers, raises their shared fill opacity, and lowers the glint; the library keeps its steadier dedicated fill. Clear mode removes backdrop filtering and pseudo-element highlights from those layers and gives them, the editor, and dialogs the opaque clear surface with a small shared shadow. The open welcome canvas stays transparent.

The Canvas paints only when its cached width, height, theme, or background changes. Its scale is the minimum of device-pixel ratio, (1.25), and the square-root factor that caps allocation at (2,000,000) pixels. A scheduled animation frame coalesces requested paints; there is no recurring paint loop, table-size observer, or measured material-map cache. Ocean and aurora share the authored ribbon geometry with different palettes; plain paints one flat light/dark ground. Optional ambient movement is a CSS compositor transform over (28s), from a gentle scaled left position to a gentle scaled right/down position. Hidden pages pause that animation without changing the painted field.

Library reveal is one short authored moment (240ms): a small upward arrival (10px), opacity settling from (.85), and blur settling from (3px). Regular controls use short background/shadow transitions and an exponential press response. Ordinary press scale is (.97); selected glass feedback is (.975). Switch knobs travel (13px).

**The Backed Data Rule.** Let glass transmit through the surrounding sheet and controls while table cells retain their dedicated, nearly opaque backing. Optical contrast must not cross dense text.

**The Local Optics Rule.** The material combines local authored geometry, source-derived CSS edges, diagonal highlights, depth, and bounded specular feedback. Apply the stronger double-edge and gradient variant only to liquid glass with full effective transparency; preserve the soft/clear recipes, source attribution, and effective system-preference behavior.

StudioGlass.refreshPreferences() recalculates live system media flags and root preferences. System reduced transparency or clear glass sets data-effects-transparency to reduced. System reduced motion, user reduced motion, effective reduced transparency, or a plain background sets data-effects-motion to reduced. System choices therefore dominate user effects settings without rewriting the saved choices. Reduced motion removes CSS animation, transitions, and smooth scrolling; reduced transparency also removes backdrop filters and yzrt pseudo-element highlights and uses the opaque clear surface. CSS media fallbacks remain in place. Preserve both data attributes and their dynamic updates.

## Shapes

The shape scale reflects physical layer size: compact table fields, softer standalone fields, small convex controls, selected port/dock lenses, and broad rounded editing/library surfaces. The welcome intake is the deepest rounded silhouette. Mobile reduces the broad editor/dialog corners to (25px), route to (24px), library to (26px), and dock to (27px).

The moderate corner option (cornerStyle soft) is a coherent alternate scale: sheet/dialog/library (17px), welcome intake (23px), route/dock (20px), eligible buttons including port/dock selections (12px), and native fields (8px). The final eligible-button selector wins over the earlier selection-radius declaration. Preserve the complete cascade instead of applying one blanket radius; short-height rules also compact the default rounded scale.

Thin translucent boundaries remain around fields and between data cells. The glass edge is an inset optical rim plus ambient depth, not a heavy external stroke. Numbered port markers and status dots are actual circles. The switch has a fixed small capsule with a circular knob; do not let generic checkbox styles change its dimensions.

**The Family Resemblance Rule.** Use the current scale of rounded fields, compact table wrappers, convex selection lenses, and broad sheets. Do not force every layer into one radius or surround every subsection with another glass card.

Icons are inline SVG geometry, normally in a (24×24) view box, with approximately (1.6–1.7) stroke and rounded joins/caps where authored. Preserve the consistent line weight. Do not replace them with emoji, icon fonts, or unrelated image assets.

## Components

### Buttons and Fields

Buttons are tactile convex controls. The primary action uses the current working accent and white text; secondary actions use translucent white in light mode and a faint blue-white ground in dark mode. Text actions keep a quiet transparent ground. Small buttons compact to (29px) minimum height with (15px) corners. Disabled controls use (.43) opacity and retain their label.

Hover increases the visible ground and depth; press compresses briefly. Keyboard focus on buttons, links, and summaries is a visible (3px) focus outline with (3px) offset. Standalone fields use the frontmatter dimensions and field ground, a thin boundary, inset depth, a translucent (3px) focus ring with (1px) offset, and a clearer focus border. Placeholders use context ink at full opacity.

Table editors stay transparent at rest, with compact table-field corners, (33px) minimum height, and (6px 7px) padding. Read-only linked values use a faint stable backing. Real native input/select/date behavior remains intact.

### Route Capsule and Instrument Dock

A route stop combines number, local/English port identity, short location code, date, and status. The active stop receives a separate convex lens and accent-filled number. Its minimum footprint is (155px × 54px), adapting to (152px × 51px) on mobile. The route owns horizontal scrolling; add-port stays accessible.

The dock names the four principal destinations directly. Active items and expanded library invokers receive a selected lens; opening the library suppresses an unrelated active lens. Save and generate remain visible. Their actions use the existing engine, including explicit pre-generation port review.

The route labels its tasks “正在准备” and gives unprepared plans a separate “未准备” label. Its ellipsis opens “管理准备列表”, where each task offers viewing, completing the call, and removal. Dates passing do not change this preparation status. List rows and their actions wrap within the existing dialog. Completing a call asks for actual arrival and departure dates, states which independent port data will be removed, and offers a single-port project download before confirmation. “仅移除” has a separate confirmation and retains the plan as unprepared.

### Voyage and Port Declaration

In 3.2.2, “航次” contains three segmented choices: “本港资料”, “未来港口计划”, and “历史挂靠港”, with counts on the latter two and a separate port-library action. The active choice uses the existing working accent with white text and exposes aria-pressed. The group and its actions wrap on small screens; they remain part of the open editing sheet. Plan and history editors share route data across ports and provide a return action to the current declaration. The existing stay field in “本港资料” is prefilled from arrival and departure dates and remains editable; manual changes, deliberate clearing, and existing nonempty values in older projects are preserved.

Document 4, “本次港口清单”, contains the current port’s declaration state, a read-only recent-ten-record summary, preview, and independent XLSX download. Source badges distinguish saved history from preceding plans that require verification. “管理航线资料” leads to the voyage plan editor. Validation links target the actual plan or history source row; main and table scroll positions are kept separately by project, port, page, and voyage subpage. These are local workflow behaviors rather than additions to the shared token or material system.

### On-Demand File Library

The library is a native nonmodal popover with a clear close action. Files, preparation, and common data retain direct names; the current document can open the same selector. It opens with search focus, filters by text across groups, shows an explicit no-result message, and lets Enter open the first visible match. Ctrl/Cmd+K opens it when no protected modal is active. A single Escape closes it even with a nonempty search and returns focus through native popover behavior. Outside dismissal remains available.

Its tiles are compact navigation controls, not a dashboard. The selected tile has the source-derived rim, readable accent ink, and aria-current. The file/common-data invokers expose their expanded state. The self-contained sidecar preview demonstrates the same conditional CSS material; production adds native popover/search behavior and pointer-positioned sheen.

### Editing Sheet, Tables, and Location Filters

The broad glass editing sheet is the main working plane. Dense tables retain their own backing, sticky headers when enabled, cell dividers, nested overflow, and visible native controls. The table wrapper owns its small outline and corner treatment. Workbook graphic previews remain white with black data even in dark mode.

Inventory filters group location and count in compact rounded controls, with a derived accent selected ground. Keep them content-sized, horizontal, and wrapping. Open sections and disclosures carry archives and estimates without introducing a dashboard of cards. Selection-dependent bulk tools appear immediately when rows are selected and disappear on clear.

### Simple Appearance Settings

Keep four common choices visible: theme (light/dark/auto), accent (blue/teal/violet), interface font size, and table density. The initially closed native disclosure, “玻璃与背景”, holds exactly four additional selects: glassStyle (liquid/soft/clear), backgroundStyle (ocean/aurora/plain), cornerStyle (rounded/soft, shown as 圆润/适中), and motion (auto/reduced). These are simple choices, with no optical sliders. The independent tableFont control remains in advanced settings.

Changes apply synchronously to root data attributes and CSS properties, save locally, and participate in the existing settings import/export. Missing appearance fields receive defaults through the existing settings schema; retain the local storage key IMO-UI-1.2. Default appearance is light, blue, interface size (14px), table size (12px), normal density, liquid glass, ocean background, rounded corners, and auto motion. “恢复默认外观” copies exactly those nine appearance fields; it preserves all other preferences and business data. A change preserves the current port/file, both scroll axes, disclosure state, focus, and selection through the existing ViewMemory boundaries.

### Defaults, Switches, and Restore

Four default sections present their saved summary and timestamp beside explicit edit/update/apply/delete actions. New-port automatic use is an actual checkbox rendered as a (34px × 21px) capsule with a (15px) knob and a (13px) checked translation. The same full-specificity treatment serves settings switches and default-auto switches.

Default application preserves the explicit per-port review workflow. Health cases stay independent. Personal-effects snapshots retain port/date/stage context; restore presents matched names and a count before confirmation. Its internally scrolling name list uses two columns on desktop and one on mobile. A restore affects matched belongings and leaves the roster intact; no-match restore stays disabled.

### Dialogs, Feedback, and Credit

Dialogs use the broad glass family and editor radius, a temporary strong lift, and a blurred scrim. The heading, independently scrolling content, and static wrapping action row are separate flex regions; actions stay inside the dialog and do not overlay the content. Modal Tab/Escape handling keeps focus inside, preserves the previous background inert state, and restores the opener on close. Restore and generation review preserve the information needed for the user's decision. Feedback pairs color with concise words or counts. Toasts size to their content, clamp the visible message to two lines, expose a close control, and replace the previous notice while restarting the dismissal timer. These notification dimensions and timing are local behavior, not a shared spacing or motion scale.

The fixed author text is “作者：郑晓天 · Author: Zheng Xiaotian” plus the program update date. It stays quiet at the viewport's lower right in its dedicated light/dark ink, at full opacity, without a user setting. It never enters Excel output.

### Source Authority and Load Order

work/app.html supplies the actual shell. work/app_shell.js owns its single final render path and current UI version (3.2.2). This workflow refinement retains the Liquid Desk 3.1 visual system and its approved 3.2.1 material extension. work/build.py composes outputs/IMO_Generator.html; versioned aliases and packages are release outputs rather than a new visual-system authority.

The stylesheet order is inherited inline base, v12.css, workflow.css, multiport.css, then **APP_STYLE concatenates liquid_desk.css, yzrt_material.css, appearance.css, prism_glass.css, and flow32.css in that order**. The first supplies topology and base controls; the second supplies the adapted yzrt material; the third supplies derived accent roles, preference variants, and short-height rules. The fourth supplies the approved full-transparency liquid variant, including double edges, stronger gradients, selected lenses, and action-row controls; its selectors leave soft/clear and effective reduced transparency outside that enhancement. The final operational layer adds in-page file controls, direct-download rows, compact issues, voyage switches, preparation-list management, scoped spacing, content-sized notices, and separated dialog regions. It does not replace the shared material or system fallbacks. document_shell.css, fusion_glass.css, app_shell.css, and discarded previews are retired visual references. Do not append them to the final cascade.

Domain, storage, settings, editor, workflow, defaults, archive, view-memory, route, and output modules load before app_help.js and app_shell.js. **css_glass.js runs last** through the retained FUSION_GLASS template slot and extends the readiness promise. Its compatible globalThis.StudioGlass exposes field, schedule, sync, refreshPreferences, filters (zero), reducedMotion, and status. It owns the bounded static ground, effective preference flags, and pointer feedback; CSS owns the final material and backdrop filtering. Runtime settings own root size, independent table size, theme, accent, density, and the four extra appearance attributes.

Trace the actual adapted material to work/reference-yzrt/纯CSS液态玻璃/css/styles.css, its SOURCE_METADATA.json and full LICENSE, the attribution header in work/yzrt_material.css, and THIRD_PARTY_NOTICES.md. Preserve the GPL-2.0 source and modification attribution in both single-file and folder/source distributions. The upstream repository is https://gitee.com/greyd097/yzrt/tree/master/; the preserved files, rather than its demo page layout, are the implementation reference.

Edit source rather than the generated HTML. Preserve ViewMemory's before/after render boundaries and stable project/port/page/subpage/region identifiers. Switching views restores main and table axes per project, port, page, and voyage subpage; same-view renders preserve focus and selection. Verify the final cascade in both themes and mobile after any source change.

## Do's and Don'ts

### Do:

- **Do** keep the masthead, floating route capsule, broad editor, and detached instrument dock legible as separate layers.
- **Do** open the file library on demand, preserve its search and keyboard dismissal, and return focus to its invoker.
- **Do** preserve the cached local Canvas ribbons, source-derived opposing CSS rims, diagonal highlights, and bounded specular response; limit the stronger double-edge variant to full-transparency liquid glass.
- **Do** retain practical table backing, internal scrolling, independent type settings, and the light/dark and preference fallbacks.
- **Do** keep explicit empty/NIL/zero states, port-specific defaults, identity-reviewed restore, and per-view scroll memory intact.
- **Do** preserve the fixed, quiet author credit at full opacity and exclude it from Excel output.
- **Do** keep four common appearance choices visible and four glass/background choices folded; respect live system effects preferences and reset only the nine appearance fields.

### Don't:

- **Don't** restore a permanent sidebar, simulated OS window, dashboard of cards, or the discarded 2.1 frame.
- **Don't** substitute a wallpaper image, an external resource, or blur alone for the implemented source-derived material, or copy the upstream demo's global contrast and text-selection rules.
- **Don't** wash the water ribbons through dense table text or stack decorative glass cards inside the editing sheet.
- **Don't** hide save/generate on mobile, leak table overflow onto the page, or trap focus in the nonmodal file library.
- **Don't** merge interface and table type controls, silently change port answers, or alter the original workbook print structure.
- **Don't** reintroduce retired stylesheets or claim a concept seed, approved comp, or detector result that does not exist.
- **Don't** reintroduce SVG displacement maps, an idle Canvas paint loop, or user settings that override the system's reduced motion or reduced transparency preference.
