# Changelog

All notable changes to this project will be documented in this file.

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Fixed` for any bugfixes.
- `Improved` for performance improvements.
- `Known Issues` for new issues not yet resolved.

## [Unreleased]

### Added

- Add exit option to speed dial.

### Changed

- Full screen width exp bar & updated animations.

### Fixed

- Unresponsive Speed dial on hover.
- Daily cards extending passed fixed length.
- Midnight refresh not updating the date parameter or list view.
- Issue where switching dates would display point change animation on exp bar.
- Issue where stale pool connections could cause app to panic after a long background period.

### Improved

- Throttle total points update on exp bar for smoother animations.
- Sqlx performance & pool health checks.

## [v0.2.2]

### Improved

- Re-index quests/points tables. Reduce execution time on dailies_weighted view by 1~1.5s.

## [v0.2.1]

### Changed

- Disable modal overflow.
- Conditionally display 'Abandon' context menu option on cards.
- Remove quest chain completion display in header.

### Improved

- Memoize various components/callbacks.
  - Prevent sibling re-renders.
  - Stop cascades to all consumers.
- Optimistic local state update instead of full re-fetch for point changes
- Split quest chain query from point change refresh.
- Eliminate unnecessary IPC calls through useEffect deps.
- Eliminate timers on non-raid type cards.
- Eliminate calls for weekly quest stats on archived quests.
- Move minute refresh timeout to top-parent component.

### Known Issues

- Exp bar shows % change when switching days.
- Restored quest uneditable until refresh.

## [v0.2.0]

### Added

- Collapsible quest chains.
- Date select for quest list/quest history.
- Note field in edit quest.
- Loading indicators to quest list/exp bar/edit daily card.
- Raid-type dailies uneditable if window is over.
- Streaks indicators to all quest type cards.
- Requirements for weekly quest types in card description.
- Percent change animation on exp bar.
- Quest name filter.
- Midnight refresh on quest list.
- Quest chain completion display in header.

### Changed

- Update viewport meta, set user-scalable=no.
- Remove window:allow-toggle-maximize permission.

### Fixed

- Default weight value when adding quest.
- Inconsistent values on daily insert for Weekly/Raid type quests.
- Incorrect time start/end fields when updating quest type.
- Rotate logs to reduce storage space.
- Limit data import/export to active user id.

### Known Issues

- Raid-type dailies sometimes uneditable within active date/time window.
- No method to edit historic values on weekly/raid type quests.
- Updating points on a quests historic view does not immediately reflect changes in main quest list view.
- Quest type `q-w-s`/`q-w-m` requirement can be set past full week.
- Current streak for quest types `q-w-s`/`q-w-m` not displaying correct values.
- App sometimes immediately exists on first open if app has been running in background for a while.
- Midnight refresh not updating date param.
- Speed dial sometimes unresponsive until first clicking anywhere else on the screen.
- Updating quest default points when quest list is filtered on an earlier date does not work.

## [v0.1.0]

This commit marks the beginning of internal testing. All previous commits should be considered experimental and highly unstable.

### Known Issues

- Changing quest name doesn't update `quest_id`. Possible collision with future quests added.
- Long press on card to sort can trigger context menu while sorting.
- Daily cards can start drag motion when viewing history.
- App component sizes are not responsive. Fixed to specific dimensions for PoC.
