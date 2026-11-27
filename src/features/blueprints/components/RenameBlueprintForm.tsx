import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const nameSchema = z.object({ name: z.string().trim().min(1, 'Enter a blueprint name.').max(80, 'Use 80 characters or fewer.') })
type RenameBlueprintFormProps = {
  readonly name: string
  readonly onRename: (name: string) => void
  readonly onCancel: () => void
}

export const RenameBlueprintForm = (props: RenameBlueprintFormProps) => {
  const form = useForm({ resolver: zodResolver(nameSchema), defaultValues: { name: props.name } })
  return <form onSubmit={form.handleSubmit((values) => props.onRename(values.name))}>
    <label htmlFor="blueprint-name" className="mb-2 block text-sm text-muted">Blueprint name</label>
    <input id="blueprint-name" autoFocus {...form.register('name')} maxLength={80} aria-invalid={Boolean(form.formState.errors.name)}
      aria-describedby="name-error" className="w-full border border-line bg-workspace px-3 py-3 text-ink" />
    <p id="name-error" className="mt-2 min-h-5 text-sm text-red-300">{form.formState.errors.name?.message}</p>
    <div className="mt-5 flex justify-end gap-3">
      <button type="button" className="border border-line px-4 py-2 text-sm" onClick={props.onCancel}>Cancel</button>
      <button type="submit" className="bg-accent px-4 py-2 text-sm font-semibold text-workspace">Rename blueprint</button>
    </div>
  </form>
}
