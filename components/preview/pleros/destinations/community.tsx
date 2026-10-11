"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeftIcon,
  EyeOffIcon,
  GlobeIcon,
  HeartIcon,
  LockIcon,
  MapPinIcon,
  MessageCircleIcon,
  MessagesSquareIcon,
  PinIcon,
  PlusIcon,
  SendIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

import { COMMUNITY_TOPICS, topicLabel, type CommunityTopicKey } from "@/lib/community/topics";
import { shiftDate } from "@/lib/sogp/daily-date";
import { cn } from "@/lib/utils";
import { seeded } from "@/lib/preview/pleros/fixtures";
import { findPerson, groupMemberIds, joinedGroup, ledGroups } from "@/lib/preview/pleros/scope";
import type { DemoGroup, DemoState } from "@/lib/preview/pleros/types";

import { useDemo } from "../demo-context";
import { Badge, CountBadge, EmptyState, Initials, PageHeader, Segmented, Sheet, buttonPrimary, buttonQuiet, buttonSecondary, focusRing, panel } from "../ui";
import {
  MEMBER_GROUPS_OWNED_MAX,
  PLEROS_AUTHOR,
  initialDiscipleshipPosts,
  initialGroupPosts,
  initialMemberGroups,
  initialPosts,
  initialQuestions,
  initialThreads,
  timeAgo,
  type DemoMemberGroup,
  type DemoPost,
  type DemoThread,
} from "./community-data";
import { Field, ListPanel, Row, Section, fieldControl, joinMonth, selectControl } from "./parts";

const TITLE_MAX = 120;
const BODY_MAX = 2000;
const textArea = `${fieldControl} min-h-24 py-2 leading-relaxed`;

// ─── People as peers see them ─────────────────────────────────────────────

/** Peers see a first name, a join month and a coarse stage only. */
function peerLabel(state: DemoState, id: string) {
  if (id === PLEROS_AUTHOR) return { name: "Pleros", detail: "Official" };
  const person = findPerson(state, id);
  if (!person) return { name: "Member", detail: "" };
  const joined = shiftDate(state.today, -(30 + Math.floor(seeded(`${id}:joined`) * 120)));
  return { name: person.firstName, detail: `${person.inCohort ? "SOGP learner" : "Member"} · ${joinMonth(joined)}` };
}

function DemoNote({ children }: { children: string }) {
  return <p className="text-[12px] text-(--color-text-muted)">{children}</p>;
}

// ─── Posts ────────────────────────────────────────────────────────────────

type Sort = "latest" | "top" | "unanswered";
type Filter = "all" | "official" | "discussion";

function PostCard({ post, onLike, onOpen }: { post: DemoPost; onLike: () => void; onOpen: () => void }) {
  const { state, viewer } = useDemo();
  const author = peerLabel(state, post.authorId);
  const liked = post.likes.includes(viewer.id);
  const topic = topicLabel(post.topic);
  return (
    <article className={cn(panel, "grid gap-3 p-4 sm:p-5")}>
      <header className="flex items-center gap-2.5">
        <Initials name={author.name} size="sm" tone={post.authorId === PLEROS_AUTHOR ? "blue" : "sky"} />
        <div className="grid min-w-0 flex-1">
          <span className="truncate text-[13px] font-medium text-(--color-text-strong)">{author.name}</span>
          <span className="truncate text-[11.5px] text-(--color-text-muted)">{author.detail} · {timeAgo(post.minutesAgo)}</span>
        </div>
        {post.pinned ? <PinIcon className="size-3.5 text-(--color-brand-blue)" aria-label="Pinned" /> : null}
        {post.kind === "official" ? <Badge tone="blue">Official</Badge> : topic ? <Badge>{topic}</Badge> : null}
      </header>
      <button type="button" onClick={onOpen} className={cn("grid gap-1 rounded-[var(--radius-sm)] text-left", focusRing)}>
        <h3 className="text-[14.5px] font-medium leading-snug text-(--color-text-strong)">{post.title}</h3>
        <p className="line-clamp-3 text-[13.5px] leading-relaxed text-(--color-text)">{post.body}</p>
      </button>
      <footer className="flex items-center gap-1">
        <button type="button" aria-pressed={liked} onClick={onLike} className={cn(buttonQuiet, "px-2", liked ? "text-red-600" : "text-(--color-text-muted)")}>
          <HeartIcon className={cn("size-4", liked && "fill-current")} aria-hidden />
          <span className="tabular-nums">{post.likes.length}</span>
          <span className="sr-only">likes</span>
        </button>
        <button type="button" onClick={onOpen} className={cn(buttonQuiet, "px-2 text-(--color-text-muted)")}>
          <MessageCircleIcon className="size-4" aria-hidden />
          <span className="tabular-nums">{post.comments.length}</span>
          <span className="sr-only">comments</span>
        </button>
      </footer>
    </article>
  );
}

function PostSheet({ post, onClose, onComment, canComment }: { post: DemoPost | null; onClose: () => void; onComment: (body: string) => void; canComment: boolean }) {
  const { state } = useDemo();
  const [draft, setDraft] = useState("");
  const author = post ? peerLabel(state, post.authorId) : null;
  return (
    <Sheet
      open={Boolean(post)}
      onClose={onClose}
      title={post?.title ?? "Post"}
      description={author ? `${author.name} · ${timeAgo(post!.minutesAgo)}` : undefined}
      footer={
        canComment ? (
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.trim()) return;
              onComment(draft.trim());
              setDraft("");
            }}
          >
            <label className="sr-only" htmlFor="demo-comment">Comment</label>
            <input id="demo-comment" className={fieldControl} value={draft} maxLength={500} placeholder="Write a comment" onChange={(event) => setDraft(event.target.value)} />
            <button type="submit" className={buttonPrimary} disabled={!draft.trim()}>Reply</button>
          </form>
        ) : undefined
      }
    >
      {post ? (
        <div className="grid gap-5">
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-(--color-text)">{post.body}</p>
          <section className="grid gap-3" aria-label="Comments">
            <h3 className="text-[13px] font-medium text-(--color-text-strong)">{post.comments.length} comments</h3>
            {post.comments.map((comment) => {
              const commenter = peerLabel(state, comment.authorId);
              return (
                <div key={comment.id} className="flex gap-2.5">
                  <Initials name={commenter.name} size="sm" />
                  <div className="grid min-w-0 gap-0.5 rounded-[var(--radius-md)] bg-(--color-surface-muted) px-3 py-2">
                    <span className="text-[12px] font-medium text-(--color-text-strong)">{commenter.name} <span className="font-normal text-(--color-text-muted)">· {timeAgo(comment.minutesAgo)}</span></span>
                    <span className="text-[13px] leading-relaxed text-(--color-text)">{comment.body}</span>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      ) : null}
    </Sheet>
  );
}

function ComposerSheet({
  open,
  onClose,
  onSubmit,
  places,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { title: string; body: string; topic: CommunityTopicKey | null; scope: string }) => void;
  places: ReadonlyArray<{ value: string; label: string }>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState<string>("");
  const [scope, setScope] = useState(places[0]?.value ?? "global");
  const [error, setError] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError(true);
      return;
    }
    onSubmit({ title: title.trim(), body: body.trim(), topic: (topic || null) as CommunityTopicKey | null, scope });
    setTitle("");
    setBody("");
    setTopic("");
    setError(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Start a discussion">
      <form className="grid gap-4" onSubmit={submit} noValidate>
        <Field label={<>Title<span aria-hidden className="text-red-600"> *</span></>}>
          <input className={cn(fieldControl, error && "border-red-500")} value={title} maxLength={TITLE_MAX} aria-invalid={error} onChange={(event) => setTitle(event.target.value)} />
          {error ? <span className="text-[13px] text-red-700">Add a title.</span> : null}
        </Field>
        <Field label="Message">
          <textarea className={textArea} value={body} maxLength={BODY_MAX} onChange={(event) => setBody(event.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Topic">
            <select className={selectControl} value={topic} onChange={(event) => setTopic(event.target.value)}>
              <option value="">No topic</option>
              {COMMUNITY_TOPICS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
          </Field>
          {places.length > 1 ? (
            <Field label="Post to">
              <select className={selectControl} value={scope} onChange={(event) => setScope(event.target.value)}>
                {places.map((place) => <option key={place.value} value={place.value}>{place.label}</option>)}
              </select>
            </Field>
          ) : null}
        </div>
        <button type="submit" className={cn(buttonPrimary, "w-fit")}>Post</button>
        <DemoNote>Posts stay in this demo tab.</DemoNote>
      </form>
    </Sheet>
  );
}

/** Feed list with sort, filter, likes, comments and a composer, all in local state. */
function PostStream({
  posts,
  setPosts,
  places,
  canPost = true,
  showFilters = true,
}: {
  posts: DemoPost[];
  setPosts: (update: (current: DemoPost[]) => DemoPost[]) => void;
  places: ReadonlyArray<{ value: string; label: string }>;
  canPost?: boolean;
  showFilters?: boolean;
}) {
  const { viewer } = useDemo();
  const [sort, setSort] = useState<Sort>("latest");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);

  const scoped = new Set(places.map((place) => place.value));
  const visible = posts
    .filter((post) => scoped.has(post.scope))
    .filter((post) => filter === "all" || post.kind === filter)
    .filter((post) => sort !== "unanswered" || post.comments.length === 0)
    .sort((a, b) =>
      Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
      (sort === "top" ? b.likes.length + b.comments.length - (a.likes.length + a.comments.length) : a.minutesAgo - b.minutesAgo),
    );
  const open = posts.find((post) => post.id === openId) ?? null;

  function update(id: number, change: (post: DemoPost) => DemoPost) {
    setPosts((current) => current.map((post) => (post.id === id ? change(post) : post)));
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showFilters ? (
          <div className="flex flex-wrap gap-2">
            <Segmented label="Sort" value={sort} onChange={setSort} options={[{ key: "latest", label: "Latest" }, { key: "top", label: "Top" }, { key: "unanswered", label: "Unanswered" }]} />
            <Segmented label="Show" value={filter} onChange={setFilter} options={[{ key: "all", label: "All" }, { key: "official", label: "Official" }, { key: "discussion", label: "Discussions" }]} />
          </div>
        ) : <span />}
        {canPost ? (
          <button type="button" className={buttonPrimary} onClick={() => setComposing(true)}>
            <PlusIcon className="size-3.5" aria-hidden />
            New discussion
          </button>
        ) : null}
      </div>

      {visible.length ? (
        <div className="grid gap-3">
          {visible.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpen={() => setOpenId(post.id)}
              onLike={() => update(post.id, (current) => ({ ...current, likes: current.likes.includes(viewer.id) ? current.likes.filter((id) => id !== viewer.id) : [...current.likes, viewer.id] }))}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={<MessagesSquareIcon className="size-5" aria-hidden />} title="No posts here yet" />
      )}

      <PostSheet
        post={open}
        canComment={canPost}
        onClose={() => setOpenId(null)}
        onComment={(body) => open && update(open.id, (post) => ({ ...post, comments: [...post.comments, { id: Date.now(), authorId: viewer.id, body, minutesAgo: 0 }] }))}
      />
      {canPost ? (
        <ComposerSheet
          open={composing}
          onClose={() => setComposing(false)}
          places={places}
          onSubmit={(input) => {
            setPosts((current) => [{ id: Date.now(), authorId: viewer.id, kind: "discussion", likes: [], comments: [], minutesAgo: 0, ...input }, ...current]);
            setComposing(false);
          }}
        />
      ) : null}
    </div>
  );
}

// ─── Feed and location group ──────────────────────────────────────────────

export function FeedDestination() {
  const { viewer, href } = useDemo();
  const [posts, setPosts] = useState(initialPosts);
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Community"
        actions={
          <>
            <Link href={href("destinations/location-group")} className={buttonSecondary}><MapPinIcon className="size-3.5" aria-hidden />{viewer.locationGroup}</Link>
            <Link href={href("destinations/messages")} className={buttonSecondary}><MessageCircleIcon className="size-3.5" aria-hidden />Messages</Link>
          </>
        }
      />
      <PostStream
        posts={posts}
        setPosts={setPosts}
        places={[{ value: "global", label: "Everyone" }, { value: "unit", label: `Your group (${viewer.locationGroup})` }]}
      />
    </div>
  );
}

export function LocationGroupDestination() {
  const { state, viewer } = useDemo();
  const [posts, setPosts] = useState(initialPosts);
  const members = state.people.filter((person) => person.locationGroup === viewer.locationGroup);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Location group" title={viewer.locationGroup} actions={<Badge tone="blue"><UsersIcon className="size-3" aria-hidden />{members.length} members</Badge>} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <PostStream posts={posts} setPosts={setPosts} places={[{ value: "unit", label: viewer.locationGroup }]} />
        <aside className="grid content-start gap-3">
          <Section title="Members" detail="Automatic by location">
            <ListPanel>
              {members.map((person) => {
                const label = peerLabel(state, person.id);
                return <Row key={person.id} title={label.name} detail={label.detail} />;
              })}
            </ListPanel>
          </Section>
          <DemoNote>Membership follows your country or state. The assigned pastor manages the group.</DemoNote>
        </aside>
      </div>
    </div>
  );
}

// ─── Member-created groups ────────────────────────────────────────────────

export function GroupsDestination() {
  const { state, viewer, notify } = useDemo();
  const [groups, setGroups] = useState(initialMemberGroups);
  const [posts, setPosts] = useState(initialGroupPosts);
  const [requested, setRequested] = useState<number[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const owned = groups.filter((group) => group.ownerId === viewer.id).length;
  const open = groups.find((group) => group.id === openId) ?? null;

  function join(group: DemoMemberGroup) {
    if (group.privacy === "public") {
      setGroups((current) => current.map((item) => (item.id === group.id ? { ...item, memberIds: [...item.memberIds, viewer.id] } : item)));
      notify(`You joined ${group.name}.`);
    } else {
      setRequested((current) => [...current, group.id]);
      notify("Request sent to the group's owner.");
    }
  }

  if (open) {
    const member = open.memberIds.includes(viewer.id);
    const readable = member || open.privacy === "public";
    return (
      <div className="grid gap-6">
        <button type="button" onClick={() => setOpenId(null)} className={cn(buttonQuiet, "w-fit px-1")}><ArrowLeftIcon className="size-3.5" aria-hidden />Community groups</button>
        <PageHeader
          eyebrow={open.privacy === "public" ? "Public group" : "Private group"}
          title={open.name}
          description={open.description}
          actions={member ? <Badge tone="done">Member</Badge> : <button type="button" className={buttonPrimary} disabled={requested.includes(open.id)} onClick={() => join(open)}>{requested.includes(open.id) ? "Requested" : open.privacy === "public" ? "Join" : "Ask to join"}</button>}
        />
        {readable ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <PostStream posts={posts} setPosts={setPosts} places={[{ value: `group:${open.id}`, label: open.name }]} canPost={member} showFilters={false} />
            <Section title="Members" detail={`${open.memberIds.length}`}>
              <ListPanel>
                {open.memberIds.map((id) => {
                  const label = peerLabel(state, id);
                  return <Row key={id} title={label.name} detail={id === open.ownerId ? "Owner" : label.detail} />;
                })}
              </ListPanel>
            </Section>
          </div>
        ) : (
          <EmptyState icon={<LockIcon className="size-5" aria-hidden />} title="Posts and members are visible to members" />
        )}
      </div>
    );
  }

  const mine = groups.filter((group) => group.memberIds.includes(viewer.id));
  const others = groups.filter((group) => !group.memberIds.includes(viewer.id));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Community groups"
        actions={<button type="button" className={buttonPrimary} disabled={owned >= MEMBER_GROUPS_OWNED_MAX} onClick={() => setCreating(true)}><PlusIcon className="size-3.5" aria-hidden />Create group</button>}
      />
      {[
        { title: "Your groups", items: mine },
        { title: "Discover", items: others },
      ].map((section) => (
        <Section key={section.title} title={section.title} detail={`${section.items.length}`}>
          {section.items.length ? (
            <ListPanel>
              {section.items.map((group) => (
                <li key={group.id}>
                  <button type="button" onClick={() => setOpenId(group.id)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-(--color-brand-sky-soft) sm:px-5", focusRing)}>
                    <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-(--color-brand-sky) text-(--color-brand-blue)">
                      {group.privacy === "public" ? <GlobeIcon className="size-4" /> : <LockIcon className="size-4" />}
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="truncate text-[13.5px] font-medium text-(--color-text-strong)">{group.name}</span>
                      <span className="truncate text-[12.5px] text-(--color-text-muted)">{group.description}</span>
                    </span>
                    <span className="text-[12px] tabular-nums text-(--color-text-muted)">{group.memberIds.length} members</span>
                  </button>
                </li>
              ))}
            </ListPanel>
          ) : (
            <EmptyState icon={<UsersIcon className="size-5" aria-hidden />} title="No groups yet" />
          )}
        </Section>
      ))}
      <DemoNote>{`You own ${owned} of ${MEMBER_GROUPS_OWNED_MAX} groups. Changes stay in this demo tab.`}</DemoNote>
      <CreateGroupSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(input) => {
          const id = Date.now();
          setGroups((current) => [...current, { id, ownerId: viewer.id, memberIds: [viewer.id], ...input }]);
          setCreating(false);
          setOpenId(id);
          notify("Group created.");
        }}
      />
    </div>
  );
}

function CreateGroupSheet({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (input: { name: string; description: string; privacy: "public" | "private" }) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [error, setError] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title="Create a group">
      <form
        className="grid gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim().length < 3) return setError(true);
          onCreate({ name: name.trim(), description: description.trim(), privacy });
          setName("");
          setDescription("");
          setError(false);
        }}
      >
        <Field label={<>Name<span aria-hidden className="text-red-600"> *</span></>}>
          <input className={cn(fieldControl, error && "border-red-500")} value={name} maxLength={60} aria-invalid={error} onChange={(event) => setName(event.target.value)} />
          {error ? <span className="text-[13px] text-red-700">Use at least three characters.</span> : null}
        </Field>
        <Field label="Description">
          <textarea className={textArea} value={description} maxLength={300} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Segmented label="Privacy" value={privacy} onChange={setPrivacy} options={[{ key: "public", label: "Public" }, { key: "private", label: "Private" }]} />
        <button type="submit" className={cn(buttonPrimary, "w-fit")}>Create group</button>
      </form>
    </Sheet>
  );
}

// ─── Messages ─────────────────────────────────────────────────────────────

export function MessagesDestination() {
  const { state, viewer } = useDemo();
  const [threads, setThreads] = useState<DemoThread[]>(() => initialThreads(viewer.id));
  const [openId, setOpenId] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const open = threads.find((thread) => thread.id === openId) ?? null;

  function startWith(peerId: string) {
    const existing = threads.find((thread) => thread.peerId === peerId);
    if (existing) {
      setOpenId(existing.id);
    } else {
      const id = Math.max(0, ...threads.map((thread) => thread.id)) + 1;
      setThreads((current) => [{ id, peerId, messages: [], unread: false }, ...current]);
      setOpenId(id);
    }
    setPicking(false);
    setQuery("");
  }

  function send(event: FormEvent) {
    event.preventDefault();
    if (!open || !draft.trim()) return;
    const body = draft.trim();
    setThreads((current) => current.map((thread) => (thread.id === open.id ? { ...thread, messages: [...thread.messages, { id: Date.now(), fromId: viewer.id, body, minutesAgo: 0 }] } : thread)));
    setDraft("");
  }

  // The new-message picker lists full names so people who share a first name can be told apart.
  const candidates = state.people.filter((person) => person.id !== viewer.id && person.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="grid gap-6">
      <PageHeader title="Messages" actions={<button type="button" className={buttonPrimary} onClick={() => setPicking(true)}><PlusIcon className="size-3.5" aria-hidden />New message</button>} />
      <div className={cn(panel, "grid min-h-[420px] overflow-hidden md:grid-cols-[280px_minmax(0,1fr)]")}>
        <ul className={cn("divide-y divide-(--color-line) md:border-r md:border-(--color-line)", open && "max-md:hidden")} aria-label="Conversations">
          {threads.map((thread) => {
            const peer = findPerson(state, thread.peerId);
            const last = thread.messages.at(-1);
            return (
              <li key={thread.id}>
                <button type="button" onClick={() => { setOpenId(thread.id); setThreads((current) => current.map((item) => (item.id === thread.id ? { ...item, unread: false } : item))); }} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-(--color-brand-sky-soft)", focusRing, thread.id === openId && "bg-(--color-brand-sky-soft)")}>
                  <Initials name={peer?.firstName ?? "Member"} size="sm" />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-[13.5px] font-medium text-(--color-text-strong)">{peer?.firstName}</span>
                    <span className="truncate text-[12.5px] text-(--color-text-muted)">{last ? last.body : "No messages yet"}</span>
                  </span>
                  {thread.unread ? <CountBadge count={1} /> : last ? <span className="text-[11px] text-(--color-text-muted)">{timeAgo(last.minutesAgo)}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <div className={cn("flex min-h-[420px] flex-col", !open && "max-md:hidden")}>
          {open ? (
            <>
              <div className="flex items-center gap-2 border-b border-(--color-line) px-4 py-3">
                <button type="button" aria-label="Back to conversations" onClick={() => setOpenId(null)} className={cn("grid size-8 place-items-center rounded-full md:hidden", focusRing)}><ArrowLeftIcon className="size-4" aria-hidden /></button>
                <Initials name={findPerson(state, open.peerId)?.firstName ?? "Member"} size="sm" />
                <span className="text-[14px] font-medium text-(--color-text-strong)">{findPerson(state, open.peerId)?.firstName}</span>
              </div>
              <ol className="grid flex-1 content-end gap-2 overflow-y-auto px-4 py-4">
                {open.messages.map((message) => {
                  const mine = message.fromId === viewer.id;
                  return (
                    <li key={message.id} className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-[13.5px] leading-relaxed", mine ? "justify-self-end bg-(--color-brand-blue) text-white" : "justify-self-start bg-(--color-surface-muted) text-(--color-text-strong)")}>
                      {message.body}
                    </li>
                  );
                })}
              </ol>
              <form className="flex items-end gap-2 border-t border-(--color-line) p-3" onSubmit={send}>
                <label className="sr-only" htmlFor="demo-message">Message</label>
                <input id="demo-message" className={fieldControl} value={draft} maxLength={2000} placeholder="Write a message" onChange={(event) => setDraft(event.target.value)} />
                <button type="submit" aria-label="Send" className={cn(buttonPrimary, "px-2.5")} disabled={!draft.trim()}><SendIcon className="size-4" aria-hidden /></button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-[13px] text-(--color-text-muted)">Choose a conversation.</div>
          )}
        </div>
      </div>
      <DemoNote>Messages stay in this demo tab and are never delivered.</DemoNote>
      <Sheet open={picking} onClose={() => setPicking(false)} title="New message">
        <div className="grid gap-3">
          <label className="sr-only" htmlFor="demo-people-search">Search people</label>
          <input id="demo-people-search" className={fieldControl} placeholder="Search by name" value={query} onChange={(event) => setQuery(event.target.value)} />
          <ul className="grid gap-1">
            {candidates.map((person) => (
              <li key={person.id}>
                <button type="button" onClick={() => startWith(person.id)} className={cn("flex w-full items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 text-left hover:bg-(--color-brand-sky-soft)", focusRing)}>
                  <Initials name={person.name} size="sm" />
                  <span className="text-[13.5px] text-(--color-text-strong)">{person.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Sheet>
    </div>
  );
}

// ─── Ask Pleros ───────────────────────────────────────────────────────────

export function AskDestination() {
  const [questions, setQuestions] = useState(initialQuestions);
  const [body, setBody] = useState("");
  const [identity, setIdentity] = useState<"" | "anonymous" | "named">("");
  const [errors, setErrors] = useState<{ body?: boolean; identity?: boolean }>({});
  const { notify } = useDemo();

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { body: !body.trim(), identity: !identity };
    setErrors(next);
    if (next.body || next.identity) return;
    setQuestions((current) => [{ id: Date.now(), body: body.trim(), anonymous: identity === "anonymous", minutesAgo: 0, reply: null }, ...current]);
    setBody("");
    setIdentity("");
    notify("Question added to this demo tab.");
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Ask Pleros" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Section title="Ask a question">
          <form className={cn(panel, "grid gap-4 p-4 sm:p-5")} onSubmit={submit} noValidate>
            <Field label={<>Your question<span aria-hidden className="text-red-600"> *</span></>}>
              <textarea className={cn(textArea, errors.body && "border-red-500")} value={body} maxLength={1000} aria-invalid={errors.body} onChange={(event) => setBody(event.target.value)} />
              {errors.body ? <span className="text-[13px] text-red-700">Write your question.</span> : null}
            </Field>
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-[13px] font-medium text-(--color-text-strong)">How should we show it?<span aria-hidden className="text-red-600"> *</span></legend>
              {([
                ["anonymous", "Ask anonymously", EyeOffIcon],
                ["named", "Show my name", UserIcon],
              ] as const).map(([value, label, Icon]) => (
                <label key={value} className={cn("flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] border px-3 py-2.5 text-[14px]", identity === value ? "border-(--color-brand-blue) bg-(--color-brand-sky-soft)" : errors.identity ? "border-red-500" : "border-(--color-line-strong)")}>
                  <input type="radio" name="identity" value={value} checked={identity === value} onChange={() => setIdentity(value)} className="accent-(--color-brand-blue)" />
                  <Icon className="size-4 text-(--color-brand-blue)" aria-hidden />
                  {label}
                </label>
              ))}
              {errors.identity ? <span className="text-[13px] text-red-700">Choose one.</span> : null}
            </fieldset>
            <button type="submit" className={cn(buttonPrimary, "w-fit")}>Send question</button>
          </form>
        </Section>
        <Section title="Your questions" detail={`${questions.length}`}>
          <ListPanel>
            {questions.map((question) => (
              <li key={question.id} className="grid gap-2 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <Badge tone={question.reply ? "done" : "neutral"}>{question.reply ? "Answered" : "Waiting for a reply"}</Badge>
                  <span className="text-[11.5px] text-(--color-text-muted)">{question.anonymous ? "Anonymous" : "Name shown"} · {timeAgo(question.minutesAgo)}</span>
                </div>
                <p className="text-[13.5px] text-(--color-text-strong)">{question.body}</p>
                {question.reply ? (
                  <p className="rounded-[var(--radius-md)] bg-(--color-brand-sky-soft) px-3 py-2 text-[13px] leading-relaxed text-(--color-text)"><span className="font-medium text-(--color-brand-blue)">Pleros: </span>{question.reply}</p>
                ) : null}
              </li>
            ))}
          </ListPanel>
        </Section>
      </div>
    </div>
  );
}

// ─── Discipleship discussions ─────────────────────────────────────────────

export function DiscipleshipDiscussionsDestination() {
  const { state, viewer } = useDemo();
  const joined = joinedGroup(state, viewer.id);
  const led = ledGroups(state, viewer.id).filter((group) => group.status === "active" && groupMemberIds(state, group.id).length > 0);
  const spaces: Array<{ group: DemoGroup; role: "joined" | "led" }> = [
    ...(joined && joined.status === "active" ? [{ group: joined, role: "joined" as const }] : []),
    ...led.map((group) => ({ group, role: "led" as const })),
  ];
  const [posts, setPosts] = useState(() => initialDiscipleshipPosts(spaces.map(({ group }) => group)));
  const [selectedId, setSelectedId] = useState(spaces[0]?.group.id ?? null);
  const selected = spaces.find(({ group }) => group.id === selectedId) ?? spaces[0];

  if (!selected) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Discipleship discussions" />
        <EmptyState icon={<MessagesSquareIcon className="size-5" aria-hidden />} title="No discipleship spaces yet" />
      </div>
    );
  }

  const members = [selected.group.leaderId, ...groupMemberIds(state, selected.group.id)];
  const joinedOn = (id: string) => state.memberships.find((membership) => membership.groupId === selected.group.id && membership.personId === id)?.joinedOn ?? selected.group.createdOn;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={selected.role === "led" ? "Group you lead" : "Group you're in"} title={selected.group.name} />
      {spaces.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Discipleship spaces">
          {spaces.map(({ group, role }) => (
            <button key={group.id} type="button" aria-pressed={group.id === selected.group.id} onClick={() => setSelectedId(group.id)} className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium", focusRing, group.id === selected.group.id ? "border-(--color-brand-blue) bg-(--color-brand-sky-soft) text-(--color-brand-blue)" : "border-(--color-line-strong) bg-white text-(--color-text-strong)")}>
              {group.name}
              <span className="text-(--color-text-muted)">· {role === "led" ? "Lead" : "Member"}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <PostStream key={selected.group.id} posts={posts} setPosts={setPosts} places={[{ value: `discipleship:${selected.group.id}`, label: selected.group.name }]} showFilters={false} />
        <aside className="grid content-start gap-3">
          <Section title="Members" detail={`${members.length}`}>
            <ListPanel>
              {members.map((id) => (
                <Row key={id} title={findPerson(state, id)?.firstName ?? "Member"} detail={id === selected.group.leaderId ? "Discipler" : joinMonth(joinedOn(id))} />
              ))}
            </ListPanel>
          </Section>
          <DemoNote>Only the discipler and current disciples see this space.</DemoNote>
        </aside>
      </div>
    </div>
  );
}
