/** Generic active/inactive state, e.g. Branch status (62-branches.md). */
export enum Status {
  Active = 'active',
  Inactive = 'inactive',
}

/** School types the platform supports (00-product-overview.md, 01-public-website.md). */
export enum SchoolType {
  PrimarySchool = 'primary_school',
  SecondarySchool = 'secondary_school',
  HighSchool = 'high_school',
  College = 'college',
  University = 'university',
  LanguageCenter = 'language_center',
  TrainingCenter = 'training_center',
  VocationalSchool = 'vocational_school',
  Other = 'other',
}
