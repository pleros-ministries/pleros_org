"use client";
import { GroupReviewMakeUp } from "./group-review-make-up";
export function MakeUpPreview() {
  return <GroupReviewMakeUp preview choose={async()=>({ok:false,error:"Read-only visual preview."})} data={{original:{id:1,title:"Week 2 · The life of faith",groupName:"Tolu’s discipleship group",startsAt:"2026-10-10T16:00:00Z",endsAt:"2026-10-10T17:00:00Z",venue:"Yaba fellowship hall",leaderName:"Tolu"},offers:[{id:1,startsAt:"2026-10-14T17:00:00Z",endsAt:"2026-10-14T18:00:00Z",venue:"Yaba fellowship hall",leaderName:"Tolu"},{id:2,startsAt:"2026-10-15T17:00:00Z",endsAt:"2026-10-15T18:00:00Z",venue:"Yaba fellowship hall",leaderName:"Tolu"}],chosenOfferId:null,completed:false,canChoose:true}} />;
}
