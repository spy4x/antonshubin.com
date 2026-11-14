---
title: "One editor per entity: why Add and Edit share one screen"
description: "Why New and Edit should open the same form, at /groups/new and /groups/:id: one set of fields and checks, a real address, and ids that let creates work offline."
tldr:
  - "In my apps, Add and Edit are one screen: New group opens the group's editor at /groups/new, and an existing group opens the same component at /groups/:id."
  - "One component means one set of fields, one check and one place for the loading, error and offline states, so create and edit cannot drift apart."
  - "A real address beats ?new: you can link to it and reload it, and after a create the address is replaced, so Back does not reopen an empty form."
  - "Ids made on the device let Seed create tags and notes offline and send them later with the same id. Groups still need a connection."
intro: "Seed's New group button used to open a dialog with one field, while editing a group showed four: description, colour and emoji besides the name. This post is for developers and product people who keep building a create form and an edit form for the same thing, and wonder whether they should."
coverImage: "/img/blog/one-editor-per-entity/cover.png"
coverAlt: "The They're The Same Picture meme from The Office: Pam is asked to find the differences between two papers labelled \"New group\" and \"Edit group\", and answers \"They're the same picture.\""
coverSize: "720x805"
publishedAt: "2026-11-14"
readTime: 8
topic: "developers"
relatedTool: "seed"
catalogSlug: "zero-to-production-saas-mvp"
seoTitle: "Why Add and Edit should be one screen"
---

![Seed's group editor twice, side by side. On the left, create mode at /groups/new: the title New group, the name Book club, a description, a books emoji, the teal colour, and Cancel and Create group buttons. On the right, the same form in edit mode for Book club, with the tabs General, Members, Billing and Activity, a changed description, and Discard and Save group buttons](/img/blog/one-editor-per-entity/new-and-edit.webp "One component at /groups/new and at /groups/:id, in Seed's public demo, whose build predates the time zone field.")

In my apps, Add and Edit are one screen. "New group" opens the group's editor at
`/groups/new` in create mode, and an existing group opens the same editor at
`/groups/:id`: the same component, the same fields, the same checks. One screen
for add and edit, never a one-field dialog for create and another form for edit.

This post is for developers and product people who build a create form and an
edit form for the same thing. I'll show the before and after from
[Seed](/tools/seed), my SaaS starter: why one component, why a real address
beats `?new`, what offline-first adds, and where Seed does not do that part yet.

## What was wrong with a "New group" dialog?

On 16 October I wrote down what annoyed me in Seed's app, and it became
[an issue](https://github.com/spy4x/template/issues/453). One item:

> Always make "Add/New <Entity>" button to open the entity's editor (in "create"
> mode), not a dialog with only one field "name". [...] it must always be THE
> SAME COMPONENT.

Here is what it was about. "New group" opened a dialog with one field (trimmed
from
[the pull request that removed it](https://github.com/spy4x/template/pull/468)):

```tsx
<Modal open title="New group" cancelLabel="Close" onClose={closeCreate}>
  <ScreenForm pending={creating} onSubmit={onCreate}>
    <Field id="group-name" label="Name" error={error} required>
      <Input name="name" maxLength={100} value={name} required autoFocus />
    </Field>
    {/* Cancel and "Create group" */}
  </ScreenForm>
</Modal>
```

Editing a group was a different thing: the name was renamed in place, and a
separate "Details" dialog held the description, colour and emoji. So a group was
born with a name only, and you had to find the second dialog to finish it. Tags,
API tokens and invitations repeated the same dialog pattern.

Nothing in it was broken. It just looked like two features that happened to
share a database table.

![The Anakin and Padme meme: Anakin says "Edit group has a colour and an emoji", Padme smiles "So New group has them too, right?", Anakin stares in silence, and Padme asks again, "Right?"](/img/blog/one-editor-per-entity/anakin.webp "It did not have them.")

## Why one component instead of two forms?

Because two forms for one thing drift. A new field has to be added twice. A
check has to be written twice. The loading, error and offline states have to be
drawn twice, and one of them gets forgotten. The person sees two different
screens for the same group and learns two layouts.

Seed's routes now point both addresses at one view
([`app.tsx`](https://github.com/spy4x/seed/blob/51aeafe4ed92d2479a4296dfcae91bf7501623a9/apps/spa/src/app.tsx#L153-L176)):

```tsx
"/groups/new": () => <GroupEditorView key="new" />,
"/groups/:groupId/:tab?": (params) => <GroupPage groupId={params.groupId} tab={params.tab} />,
```

`GroupPage` renders the same `GroupEditorView` with the group's id, and the view
picks the mode
([`GroupEditorView.tsx`](https://github.com/spy4x/seed/blob/51aeafe4ed92d2479a4296dfcae91bf7501623a9/apps/spa/src/views/GroupEditorView.tsx#L146-L204)):

```tsx
{
  groupId === null
    ? <NewGroup />
    : <ExistingGroup groupId={groupId} tab={tab} />
}
```

Both branches draw one `GroupEditorScreen`. Create mode passes `creating`; edit
mode passes the saved group. What that buys:

1. **One set of fields.** Name, description, emoji, colour and, since November,
   the group's time zone, in both modes. A create sends them all in one request.
2. **One check.** `checkGroupDraft` checks the draft with the server's own
   parsers, so a typo is caught before the round trip, and both `create()` and
   `save()` call it
   ([`groups.ts`](https://github.com/spy4x/seed/blob/51aeafe4ed92d2479a4296dfcae91bf7501623a9/apps/spa/src/state/groups.ts#L137-L160)).
3. **One place for every state.** Loading, "this group does not exist", errors
   under their field, saving, the offline notice. Written once, so create cannot
   forget one.
4. **Small, visible differences.** Create mode says "New group" with Cancel and
   "Create group". Edit mode is titled with the saved name, and Discard and
   "Save group" show only after you change something. Leaving with unsaved
   changes asks first, in both.

The fields themselves come from my own
[Preact component library](/blog/preact-component-library-without-shadcn), so
the editor is mostly wiring. The note editor already worked this way; it was the
model. Seed's UI rules now say it as rule 2,
["One editor per entity"](https://github.com/spy4x/seed/blob/51aeafe4ed92d2479a4296dfcae91bf7501623a9/docs/design/ui-layout.md#L17-L25),
so the next entity an app adds starts right.

![The Buff Doge versus Cheems meme: the muscular doge is labelled "One editor: one set of fields, one check, one offline notice", and the small crying Cheems is labelled "Two forms: which one has the colour?"](/img/blog/one-editor-per-entity/doge.webp "One of them knows where the colour field is.")

## Why `/groups/new` and not `?new`?

Before, "New group" in the group switcher went to `/groups?new`, and the groups
page opened the dialog when it saw `new` in the query. A dialog over a list is
not a place. `/groups/new` is: you can link to it, reload it, and leave it with
Back, and the browser's history makes sense.

The interesting moment is right after the create. The address `/groups/new` is
now wrong: the group exists. So Seed swaps it for the group's page instead of
pushing a new entry
([`GroupEditorView.tsx`](https://github.com/spy4x/seed/blob/51aeafe4ed92d2479a4296dfcae91bf7501623a9/apps/spa/src/views/GroupEditorView.tsx#L48-L71)):

```tsx
const group = await groups.create()
if (!group) return false
// The group is in the list before the address changes, so its page draws at once.
navigate(GROUP_PATHS.settings(group.id), { replace: true })
void selection.select(group.id)
```

`replace: true` is the whole trick. Back from the new group goes to where you
were before, the groups list in my case, not to an emptied "New group" form. The
new group also becomes your current one, since you made it to work in it, and a
toast says so. No reload: the route changes inside the app, and the same editor
draws again in edit mode, now with the Members, Billing and Activity tabs.

![The Is This a Pigeon meme: a man labelled "Me" points at a butterfly labelled "?new" and asks "Is this a page?"](/img/blog/one-editor-per-entity/pigeon.webp "It was a query string with a dialog attached.")

## What does offline-first add?

In an offline-first app the device makes the id, not the database. Seed gives
every new record a UUID version 7 on the client
([`newId: () => uuidV7()`](https://github.com/spy4x/seed/blob/51aeafe4ed92d2479a4296dfcae91bf7501623a9/apps/spa/src/state/groups.ts#L613))
and sends it with the create. Since the id exists before the server answers, the
editor's address exists too.

Tags and notes go one step further: you can create them with no connection. Here
is a tag I created in the demo with the network off:

![Seed's tag editor in the demo with the network off: a line "Offline, 1 change waiting", the tag "Written offline" in the group Book club, already in edit mode, and a notice "You're offline. Your changes are saved on this device and sync when you're back online."](/img/blog/one-editor-per-entity/tag-offline.webp "Created with no network: the tag already has its own address and is in edit mode.")

What happened there:

1. "Create tag" put the create into a queue on the device, with the tag's id.
2. The tag showed up in the list, and the editor moved from `/tags/new` to
   `/tags/<id>` in edit mode, exactly as it does online.
3. When the network came back, the queue sent `tag.create` with the same id
   ([`new-ids.test.ts`](https://github.com/spy4x/seed/blob/51aeafe4ed92d2479a4296dfcae91bf7501623a9/apps/spa/src/offline/new-ids.test.ts#L157-L175)
   checks exactly this).
4. If the queue sends a create again because an answer got lost, the server
   refuses a second create with an id it already holds ("Tag id is already in
   use"), so a retry cannot make a copy.

One editor helps here too: the group editor's offline notice is written once,
with one sentence for creating and one for saving, and both modes show it.

Now the honest part. Groups don't do this yet. Creating a group needs the
server. With no network, the group editor lets you fill in the form and says
"You can fill this in now, but you need a connection to create the group." A
create that fails keeps what you typed. Each try at a group also gets a fresh
id, so the same-id protection covers tags and notes, not groups. The rest of
Seed's offline layer is in the [Seed post](/blog/seed-saas-starter).

![The Waiting Skeleton meme: a skeleton on a park bench, captioned "Waiting for the server to pick the new id"](/img/blog/one-editor-per-entity/skeleton.webp "With ids made on the device, nobody sits on this bench.")

## What else did one editor drag along?

The same issue had more in it, and my AI agents built it in four pull requests
in Seed's previous repository, on 16 and 17 October (how I run them is in
[my AI coding agent setup](/blog/ai-coding-agent-setup)):

- [Tags](https://github.com/spy4x/template/pull/461) got `/tags/new` and
  `/tags/:tagId` first, with one `TagEditorScreen`.
- [Groups](https://github.com/spy4x/template/pull/468) got the editor above.
  Clicking a group in the list now opens its editor, not its notes, and the
  "Open notes" button is gone: notes are not the only thing an app will ever
  have.
- [API tokens and invitations](https://github.com/spy4x/template/pull/479) are
  created on pages too, at `/tokens/new` and `/groups/:groupId/invitations/new`.
  They are never edited, so their pages are create-only, in two steps: the form,
  then the token or link shown once, with "Leave without copying?" if you try to
  leave first. A dialog that shows a secret once is very easy to close by
  accident.
- The [header bar went away](https://github.com/spy4x/template/pull/483), and
  the sidebar is now the app's only frame. Not about editors, but the same
  issue.

![The One Does Not Simply meme: Boromir, captioned "One does not simply turn one dialog into a page"](/img/blog/one-editor-per-entity/one-does-not-simply.webp "One dialog, four pull requests.")

So the next time a "New something" button opens a dialog with one field, ask
what the edit screen looks like. If the answer is "different", you have two
forms, and they have already started drifting.
