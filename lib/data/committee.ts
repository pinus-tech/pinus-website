/**
 * Committee roster — edit this file to update the /committee page.
 * Add photos under `public/committee/` (e.g. `/committee/jane-doe.jpg`) and set `photo` to that path.
 * Leave `photo` empty to use the default placeholder image on the page.
 */

export interface CommitteeMember {
  id: string;
  committeeGroup: string;
  name: string;
  role: string;
  /** Public URL path, e.g. `/committee/name.jpg` — file should live in `public/committee/` */
  photo: string;
}

export const COMMITTEE_MEMBERS: CommitteeMember[] = [
  {
    id: "exc-1",
    committeeGroup: "Executive Committee",
    name: "Member name",
    role: "President",
    photo: "",
  },
  {
    id: "exc-2",
    committeeGroup: "Executive Committee",
    name: "Member name",
    role: "Vice President",
    photo: "",
  },
  {
    id: "dept-1",
    committeeGroup: "Department example",
    name: "Member name",
    role: "Director",
    photo: "",
  },
];
