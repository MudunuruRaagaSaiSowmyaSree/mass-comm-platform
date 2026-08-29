import { apiClient } from "./client";


/* ============================================================
   AUDIENCE MEMBER
   ============================================================ */

export interface AudienceMember {
  id: string;

  name: string;

  email: string | null;

  phone: string | null;

  language: string;

  geography: string | null;

  occupation: string | null;

  org_id: string | null;

  engagement_score: number;

  last_contacted_at: string | null;
}


/* ============================================================
   SEGMENT FILTERS
   ============================================================ */

export interface SegmentFilters {
  language?: string;

  geography?: string;

  occupation?: string;

  org_id?: string;

  min_engagement?: number;

  max_engagement?: number;
}


/* ============================================================
   FETCH ALL AUDIENCE
   ============================================================ */

export async function fetchAudience(): Promise<
  AudienceMember[]
> {
  const res = await apiClient.get(
    "/audience/"
  );

  return res.data;
}


/* ============================================================
   CREATE AUDIENCE MEMBER
   ============================================================ */

export async function createAudienceMember(
  data: Partial<AudienceMember>
) {
  const res = await apiClient.post(
    "/audience/",
    data
  );

  return res.data;
}


/* ============================================================
   DELETE AUDIENCE MEMBER
   ============================================================ */

export async function deleteAudienceMember(
  id: string
) {
  await apiClient.delete(
    `/audience/${id}`
  );
}


/* ============================================================
   BUILD SEGMENT PARAMETERS
   ============================================================ */

function buildSegmentParams(
  filters: SegmentFilters
) {
  const params =
    new URLSearchParams();


  if (filters.language) {
    params.append(
      "language",
      filters.language
    );
  }


  if (filters.geography) {
    params.append(
      "geography",
      filters.geography
    );
  }


  if (filters.occupation) {
    params.append(
      "occupation",
      filters.occupation
    );
  }


  if (filters.org_id) {
    params.append(
      "org_id",
      filters.org_id
    );
  }


  if (
    filters.min_engagement !==
      undefined &&
    filters.min_engagement !== null
  ) {
    params.append(
      "min_engagement",
      String(
        filters.min_engagement
      )
    );
  }


  if (
    filters.max_engagement !==
      undefined &&
    filters.max_engagement !== null
  ) {
    params.append(
      "max_engagement",
      String(
        filters.max_engagement
      )
    );
  }


  return params;
}


/* ============================================================
   FETCH SEGMENT
   ============================================================ */

export async function fetchSegment(
  filters: SegmentFilters
): Promise<AudienceMember[]> {
  const params =
    buildSegmentParams(filters);

  const query =
    params.toString();

  const url = query
    ? `/audience/segment?${query}`
    : "/audience/segment";

  const res =
    await apiClient.get(url);

  return res.data;
}


/* ============================================================
   FETCH SEGMENT COUNT
   ============================================================ */

export async function fetchSegmentCount(
  filters: SegmentFilters
): Promise<number> {
  const params =
    buildSegmentParams(filters);

  const query =
    params.toString();

  const url = query
    ? `/audience/segment/count?${query}`
    : "/audience/segment/count";

  const res =
    await apiClient.get(url);

  return res.data.count;
}