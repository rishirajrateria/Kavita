/**
 * Dynamic-import map of every research module, keyed by file stem
 * (`india/maharashtra/mumbai` → `india--maharashtra--mumbai`).
 *
 * Writers: add your file to this folder AND one line below. Keep the list ALPHABETICAL by key
 * so concurrent edits merge trivially; on a conflict, re-read and re-add your line.
 * `src/content/locations/index.ts` merges these onto the base records at load time.
 */
import type { ResearchModule } from "../schema";

export const researchByPath: Record<string, () => Promise<ResearchModule>> = {
  // e.g. "india--maharashtra--mumbai": () => import("./india--maharashtra--mumbai"),
  australia: () => import("./australia"),
  "australia--new-south-wales--sydney": () => import("./australia--new-south-wales--sydney"),
  "australia--victoria--melbourne": () => import("./australia--victoria--melbourne"),
  canada: () => import("./canada"),
  "canada--british-columbia": () => import("./canada--british-columbia"),
  "canada--british-columbia--vancouver": () => import("./canada--british-columbia--vancouver"),
  "canada--ontario": () => import("./canada--ontario"),
  "canada--ontario--brampton": () => import("./canada--ontario--brampton"),
  "canada--ontario--toronto": () => import("./canada--ontario--toronto"),
  india: () => import("./india"),
  "india--chandigarh--chandigarh": () => import("./india--chandigarh--chandigarh"),
  "india--delhi--delhi": () => import("./india--delhi--delhi"),
  "india--gujarat--ahmedabad": () => import("./india--gujarat--ahmedabad"),
  "india--gujarat--surat": () => import("./india--gujarat--surat"),
  "india--haryana--gurugram": () => import("./india--haryana--gurugram"),
  "india--karnataka--bengaluru": () => import("./india--karnataka--bengaluru"),
  "india--kerala--kochi": () => import("./india--kerala--kochi"),
  "india--madhya-pradesh--indore": () => import("./india--madhya-pradesh--indore"),
  "india--maharashtra--mumbai": () => import("./india--maharashtra--mumbai"),
  "india--maharashtra--pune": () => import("./india--maharashtra--pune"),
  "india--rajasthan--jaipur": () => import("./india--rajasthan--jaipur"),
  "india--tamil-nadu--chennai": () => import("./india--tamil-nadu--chennai"),
  "india--telangana--hyderabad": () => import("./india--telangana--hyderabad"),
  "india--uttar-pradesh--lucknow": () => import("./india--uttar-pradesh--lucknow"),
  "india--uttar-pradesh--noida": () => import("./india--uttar-pradesh--noida"),
  "india--west-bengal--kolkata": () => import("./india--west-bengal--kolkata"),
  singapore: () => import("./singapore"),
  "singapore--singapore--singapore-city": () => import("./singapore--singapore--singapore-city"),
  "united-arab-emirates": () => import("./united-arab-emirates"),
  "united-arab-emirates--abu-dhabi--abu-dhabi": () =>
    import("./united-arab-emirates--abu-dhabi--abu-dhabi"),
  "united-arab-emirates--dubai--dubai": () => import("./united-arab-emirates--dubai--dubai"),
  "united-arab-emirates--sharjah--sharjah": () =>
    import("./united-arab-emirates--sharjah--sharjah"),
  "united-kingdom": () => import("./united-kingdom"),
  "united-kingdom--england": () => import("./united-kingdom--england"),
  "united-kingdom--england--birmingham": () => import("./united-kingdom--england--birmingham"),
  "united-kingdom--england--leicester": () => import("./united-kingdom--england--leicester"),
  "united-kingdom--england--london": () => import("./united-kingdom--england--london"),
  "united-states": () => import("./united-states"),
  "united-states--california": () => import("./united-states--california"),
  "united-states--california--san-francisco-bay-area": () =>
    import("./united-states--california--san-francisco-bay-area"),
  "united-states--illinois--chicago": () => import("./united-states--illinois--chicago"),
  "united-states--new-jersey": () => import("./united-states--new-jersey"),
  "united-states--new-jersey--edison": () => import("./united-states--new-jersey--edison"),
  "united-states--new-york--new-york-city": () =>
    import("./united-states--new-york--new-york-city"),
  "united-states--texas": () => import("./united-states--texas"),
  "united-states--texas--dallas": () => import("./united-states--texas--dallas"),
  "united-states--texas--houston": () => import("./united-states--texas--houston"),
};
