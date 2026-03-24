import "server-only";

export interface UpstreamDistrictCode {
  String: string;
  Valid: boolean;
}

export interface UpstreamDistrict {
  id: number;
  name: string;
  code: UpstreamDistrictCode;
  created_at: string;
  updated_at: string;
}

export interface DistrictRecord {
  code: string;
  createdAt: string;
  id: number;
  name: string;
  updatedAt: string;
}

export interface UpstreamSubcounty {
  id: number;
  district_id: number;
  name: string;
  code: UpstreamDistrictCode;
  created_at: string;
  updated_at: string;
}

export interface SubcountyRecord {
  code: string;
  createdAt: string;
  districtName?: string;
  districtId: number;
  id: number;
  name: string;
  updatedAt: string;
}

export interface UpstreamVillage {
  id: number;
  district_id: number;
  subcounty_id: number;
  parish_id: number;
  name: string;
  code: UpstreamDistrictCode;
  created_at: string;
  updated_at: string;
}

export interface VillageRecord {
  code: string;
  createdAt: string;
  districtId: number;
  districtName?: string;
  id: number;
  name: string;
  parishId: number;
  subcountyId: number;
  updatedAt: string;
}

const DISTRICTS_ENDPOINT =
  process.env.HEALTH_PORTAL_DISTRICTS_URL ??
  "https://response.health.go.ug/api/locations/districts";
const VILLAGES_ENDPOINT =
  process.env.HEALTH_PORTAL_VILLAGES_URL ??
  "https://response.health.go.ug/api/locations/villages/";

function getSubcountiesEndpoint(districtId: number) {
  const endpointTemplate = process.env.HEALTH_PORTAL_SUBCOUNTIES_URL_TEMPLATE;

  if (endpointTemplate && endpointTemplate.includes("{districtId}")) {
    return endpointTemplate.replace("{districtId}", `${districtId}`);
  }

  return `https://response.health.go.ug/api/locations/subcounties/${districtId}`;
}

function normalizeDistrictName(name: string) {
  return name.replace(/\s+District District$/i, " District").trim();
}

function formatDistrictCode(code: UpstreamDistrictCode) {
  return code.Valid && code.String.trim().length > 0 ? code.String.trim() : "Not set";
}

function pickPreferredDistrict(current: DistrictRecord, candidate: DistrictRecord) {
  const currentIsCanonical = current.name === normalizeDistrictName(current.name);
  const candidateIsCanonical = candidate.name === normalizeDistrictName(candidate.name);

  if (currentIsCanonical !== candidateIsCanonical) {
    return candidateIsCanonical ? candidate : current;
  }

  const currentHasCode = current.code !== "Not set";
  const candidateHasCode = candidate.code !== "Not set";

  if (currentHasCode !== candidateHasCode) {
    return candidateHasCode ? candidate : current;
  }

  return candidate.updatedAt > current.updatedAt ? candidate : current;
}

function normalizeDistricts(districts: UpstreamDistrict[]) {
  const uniqueDistricts = new Map<string, DistrictRecord>();

  for (const district of districts) {
    const normalized: DistrictRecord = {
      code: formatDistrictCode(district.code),
      createdAt: district.created_at,
      id: district.id,
      name: normalizeDistrictName(district.name),
      updatedAt: district.updated_at
    };

    const key = normalized.name.toLowerCase();
    const existing = uniqueDistricts.get(key);

    uniqueDistricts.set(
      key,
      existing ? pickPreferredDistrict(existing, normalized) : normalized
    );
  }

  return Array.from(uniqueDistricts.values()).sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

export async function fetchDistricts() {
  const response = await fetch(DISTRICTS_ENDPOINT, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`District request failed with status ${response.status}`);
  }

  const districts = (await response.json()) as UpstreamDistrict[];

  return normalizeDistricts(districts);
}

export async function fetchSubcounties(districtId: number) {
  const response = await fetch(getSubcountiesEndpoint(districtId), {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Subcounty request failed with status ${response.status}`);
  }

  const subcounties = (await response.json()) as UpstreamSubcounty[];

  return subcounties
    .map(
      (subcounty): SubcountyRecord => ({
        code: formatDistrictCode(subcounty.code),
        createdAt: subcounty.created_at,
        districtId: subcounty.district_id,
        id: subcounty.id,
        name: subcounty.name.trim(),
        updatedAt: subcounty.updated_at
      })
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function fetchAllSubcounties() {
  const districts = await fetchDistricts();
  const subcountyGroups = await Promise.all(
    districts.map(async (district) => {
      const subcounties = await fetchSubcounties(district.id);

      return subcounties.map((subcounty) => ({
        ...subcounty,
        districtName: district.name
      }));
    })
  );

  return subcountyGroups
    .flat()
    .sort((left, right) => {
      const districtComparison = (left.districtName ?? "").localeCompare(right.districtName ?? "");

      if (districtComparison !== 0) {
        return districtComparison;
      }

      return left.name.localeCompare(right.name);
    });
}

export async function fetchVillages() {
  const [districts, response] = await Promise.all([
    fetchDistricts(),
    fetch(VILLAGES_ENDPOINT, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    })
  ]);

  if (!response.ok) {
    throw new Error(`Village request failed with status ${response.status}`);
  }

  const villages = (await response.json()) as UpstreamVillage[];
  const districtNamesById = new Map(districts.map((district) => [district.id, district.name]));

  return villages
    .map(
      (village): VillageRecord => ({
        code: formatDistrictCode(village.code),
        createdAt: village.created_at,
        districtId: village.district_id,
        districtName: districtNamesById.get(village.district_id),
        id: village.id,
        name: village.name.trim(),
        parishId: village.parish_id,
        subcountyId: village.subcounty_id,
        updatedAt: village.updated_at
      })
    )
    .sort((left, right) => {
      const districtComparison = (left.districtName ?? "").localeCompare(right.districtName ?? "");

      if (districtComparison !== 0) {
        return districtComparison;
      }

      if (left.subcountyId !== right.subcountyId) {
        return left.subcountyId - right.subcountyId;
      }

      if (left.parishId !== right.parishId) {
        return left.parishId - right.parishId;
      }

      return left.name.localeCompare(right.name);
    });
}
