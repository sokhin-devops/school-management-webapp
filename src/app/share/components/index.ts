/**
 * The shared list-page kit. Record lists across the app (People, Academic,
 * Finance …) are built from these rather than each page re-solving the toolbar,
 * the scroll layout and the empty state.
 */
export { ListShellComponent } from './list-shell/list-shell.component';
export { ListToolbarComponent } from './list-toolbar/list-toolbar.component';
export { EmptyStateComponent } from './empty-state/empty-state.component';
export { StatusTagComponent } from './status-tag/status-tag.component';
export { RowActionsComponent, type RowAction } from './row-actions/row-actions.component';
export { PersonCardComponent, type PersonCardMeta } from './person-card/person-card.component';
export { SettingsSectionComponent } from './settings-section/settings-section.component';
export { FormFieldComponent } from './form-field/form-field.component';
export { FormDialogComponent } from './form-dialog/form-dialog.component';
export { FormErrorDialogComponent } from './form-error-dialog/form-error-dialog.component';
