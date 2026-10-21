## verdict

1. **Resolved — validation-message recovery and field focus.** The rebuilt `issueView` matches the actual engine's ship/voyage messages. `issueTarget` maps the cited ship, voyage, signature, health, certificate, personal-effects and case fields; `wsFix` searches only inside the intended `[data-ws-editor]`, and health row recovery uses `cases`. `flow32-recovery-chrome.json` and `flow32-recovery-msedge.json` each record sixteen actual engine errors clicked from the output list, with the expected view and exact field, editor-contained focus, no file-picker focus, and correct second-person/second-case identifiers. The test source obtains these messages from `checkAll`, rather than substituting invented message strings. The single-review error links retain the same corrected recovery handler.
2. **Resolved — review total.** The fresh `port-review.png` visibly retains a checked but blocked port and now correctly says `可生成 0 港 · 0 份文件`. The readiness protection and disabled generation action remain coherent with that label. The corresponding actual check passes in both browsers.
3. **Resolved — help navigation.** Rebuilt `app_help.js` places `生成本港 ZIP` on the Output page, names the dock action `批量生成 N 港`, and removes the obsolete `检查并生成` instruction from the cited topics. Source and packaged help/shell assets match after newline normalization.

All eleven required same-path recaptures were reopened and remain valid. No regression introduced by this fix batch is visible in those captures or the inspected changed paths. `flow32-report.json` records 28 passing groups with empty errors, requests and failures. This is a limited scoring verdict for the three original material findings; it does not reopen the complete surface review or establish native Excel/WPS printing, a detector result, or untested recovery cases.

## remaining

Clear for the three scored fixes. No additional visual correction or recapture is required by this verdict. The planned documentation handoff remains outside this scoring pass.

disposition: ship

---

The initial independent review below is retained as historical evidence. Its three open findings are superseded by the limited verdict above.

Initial disposition: fix

No separate QUALITY BAR image or approved comp was supplied; this is an incumbent, code-led Operate refinement, and the quality bar is recorded in `work/flow32-direction.md`. Native Excel/WPS rendering remains unverified. No detector verdict is claimed.

## persistence

Pass for the review inputs. `PRODUCT.md`, incumbent `DESIGN.md`, the 3.2 direction, and the UI audit exist. The requested behavior is persisted without replacing the Liquid Desk identity. DESIGN remains at 3.1 pending the already planned documentation handoff; its visual system still describes the inspected material and topology. The 3.2 source and folder assets match after normalizing CRLF/LF. The original engine, template configuration, local data model, and workbook generation path remain in use.

All eleven required current captures were opened: `editor-1280.png`, `output-desktop.png`, `single-context.png`, `single-review.png`, `single-errors.png`, `output-errors.png`, `port-review.png`, `editor-mobile.png`, `output-mobile.png`, `dark-output.png`, and `short-editor.png`. They are valid captures of the claimed states at the supplied viewport classes, with document tops present. The short capture shows the top of a scrollable working area rather than an active table row. The five supplied incumbent captures were also opened. Synthetic demonstration content is identified in the masthead. No recapture is required to repair evidence validity.

Existing reports support 24 flow groups across Chrome/Edge, 32 incumbent regression groups, 14 modal keyboard groups, two genuine ten-file ZIP groups, and the supplied layout matrix. This review independently checked the export isolation and actual engine-message vocabulary; those reports do not cover all recovery mappings.

## fidelity

| Element / promise | Assessment | Evidence |
| --- | --- | --- |
| TYPE | Match | Native Chinese/Latin operational type, clear current-file headline, compact labels, and independent readable table type remain consistent with DESIGN and the before captures. |
| MATERIAL | Match | Pinned glass route/dock, source-derived rims, broad steadier editor, and solid data backing remain intact. The request does not call for a new physical material or raster asset. |
| GROUND | Match | Authored aqua/periwinkle/peach light ground and deep blue dark ground remain faithful to the incumbent palette. |
| Open desk topology | Match | Masthead, detached route, broad editor, on-demand library, and floating instrument dock are preserved. No permanent sidebar or replacement visual world appears. |
| Direct single-file download | Match | Editor and output captures expose direct XLSX actions. Source connects editor, output row, and filled preview to isolated `checkSingle`/`generateSingle`; the original workbook engine is retained and no `commitGenerated` or output-selection mutation appears in that path. |
| Relevant confirmations | Match | Personal-effects review asks dates only; health review asks dates plus health. Source adds NIL only for file 9 and retains stale/revision protection. |
| Faster document switching | Acceptable adaptation | Native select plus bounded previous/next controls directly satisfy the user's convenience request and the 3.2 direction. |
| Output scope | Acceptable adaptation with one defect | Current-port ZIP and multiport actions are separately named. However, `port-review.png` shows a checked Brisbane port while the header says `已勾选 0 港`; the displayed number counts ready ports rather than checked ports. |
| Compact error recovery | Contradicted | Error lists are visually shorter, but actual shared ship/voyage errors route to the document editor. Unknown field recovery can focus the new file-switch select instead of an editor field. This fails the direction's correct error/field-navigation promise. |
| Help follows the shipped workflow | Contradicted | First-use help places `生成本港 ZIP` in the bottom dock, and the voyage topic still names `检查并生成`; neither matches the current controls. |
| Mobile / short layout | Acceptable adaptation | Mobile puts the file picker and direct download on separate rows, preserves save/generate, and retains internal table overflow. Short landscape needs working-area scrolling but does not lose the controls. No further topology change is justified. |
| Credit and offline truth | Match at inspected scope | Fixed bilingual author/update text remains quiet and visible. Existing no-network reports are clear; no unsupported server or printing claim appears. Actual Office/WPS print rendering is not established by browser captures. |

## ceiling

Reached for this workflow refinement's visual scope. The new controls use the incumbent material, readable backing, native selects, and dock hierarchy. The available working area is used more efficiently than the incumbent without adding another navigation layer. The requested improvement is operational; extra ornament, new motion, lettering, or a new frame would dilute the pinned world. The remaining ceiling gap is accurate recovery and scope feedback, not visual ambition.

## material_fixes

1. **P2 — Correct actual validation-message recovery before shipping** (`work/app_shell.js:69`, `:138`; `work/engine.js:28–37`): route the real prefixes `缺少船舶资料：…`, `船舶档案尚未确认`, IMO/net-tonnage errors to ship; `缺少航次资料：…`, invalid voyage/signature dates, reversed arrival/departure dates, `健康申报缺少下一港`, and medicine-month errors to voyage; map their field targets. Restrict fallback focus to the intended editor so health questions, effects quantities, and other unmapped errors cannot focus `data-flow-document`. A pure source check reproduced six wrong routes from actual engine strings, while the existing stay/passenger cases passed. Verify representative real engine errors through output and protected single-file review, preserving the correct port.
2. **P2 — Make the review total describe what it counts** (`work/app_shell.js:140`, `port-review.png`): change the ready-only total's label from `已勾选` to `可生成`, or expose selected and ready totals separately. A checked but blocked port must not be described as zero checked ports; preserve current readiness protection.
3. **P2 — Align first-use help with the actual controls** (`work/app_help.js:5–6`): place current-port ZIP under the Output page and name the dock action `批量生成 N 港`; remove the obsolete `检查并生成` reference. Keep the more detailed single-file topic.

## keep

Keep the three direct single-file entry points, unchanged ZIP selection/batch baseline/other ports, relevant confirmations, explicit current-port versus batch scope, compact disclosures, native file switching, protected modal focus/scroll, all ten original workbook templates and print structure, offline operation, pinned Liquid Glass, and fixed page-only bilingual credit. Apply the three narrow fixes in one batch, rebuild once, and return the same viewport captures plus representative recovery evidence for a scoring verdict; no visual reset or new detector pass.
