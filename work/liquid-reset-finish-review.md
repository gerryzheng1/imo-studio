## verdict

Scoped verdict pass: this scores the three material fixes from the initial review and the subsequently reproduced home-roundtrip scroll regression. All ten required captures were reopened for the original three fixes at the same paths under .impeccable/review/liquid-reset/ and remain valid: welcome.png, desktop.png, library.png, defaults.png, stores.png, user-1280.png, mobile.png, mobile-library.png, dark.png and restore-preview.png. The new item is a nonvisual state-key defect; code and the actual two-axis regression test are the appropriate scoped evidence.

1. Resolved - Nonempty-search Escape recovery. work/app_shell.js:153 now prevents the native search Escape default, stops propagation and calls closeLibrary(). The actual Chrome and Edge navigation report records passing nonempty-query dismissal and focus return to filesDock; the test asserts the popover is hidden after one Escape. The handler closes the UI without writing document data.
2. Resolved - Instructions after topology replacement. The active work/app_help.js start, voyage, crew and pdf topics now point to the actual bottom data/files/voyage controls and the top port-plan add action. The paths correspond to the controls in the unchanged desktop and mobile captures. The instruction to select the table's leftmost row checkboxes remains accurate.
3. Resolved - Default auto-use control geometry. Recaptured defaults.png visibly shows four complete pill tracks with white thumbs contained inside their right ends, replacing the previous blue dots and displaced knobs. The base, checked and pseudo-element rules now consistently use input[type=checkbox][data-default-auto], allowing the intended 34px by 21px track to win over the generic checkbox rule. The existing checked/unchecked transform and native disabled attribute remain in place; this fix changes selector specificity rather than default-use state handling.
4. Resolved - Home-roundtrip scroll memory. work/app_shell.js:89 now uses ui.home ? 'home' : view for the view component while retaining the existing project, port and port-tab components. The welcome DOM can no longer overwrite the arrival document's saved scroll regions. The supplied rebuilt verify_home_scroll.mjs execution reports before [240,280] and after [240,280], replacing the reproduced [240,280] to [0,0] failure. The refreshed navigation report again records all 16 Chrome/Edge groups passing, including home/continue and library keyboard recovery. This is a nonvisual key correction; no additional screenshots were required or claimed.

Fix-introduced regressions: none identified within the scored fix scope, the same ten visual recaptures and the rebuilt functional evidence. The refreshed navigation report contains 16 passing Chrome/Edge groups with empty error and remote-request lists. No additional defect hunt or detector pass was performed.

## remaining

Clear for all four scored fixes: the original three findings and the additional reproduced home-roundtrip scroll regression are resolved. This ship verdict covers the scored fixes only; it is not a new whole-surface review. Continue to the required documentation handoff.

disposition: ship
