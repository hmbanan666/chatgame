import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type * as tables from '../tables'

export type Profile = InferSelectModel<typeof tables.profiles>
export type ProfileDraft = InferInsertModel<typeof tables.profiles>
