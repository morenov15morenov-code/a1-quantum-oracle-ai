import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function parsePagination(searchParams: URLSearchParams) {
  const result = paginationSchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!result.success) {
    return null;
  }

  const { page, limit } = result.data;
  return { page, limit, skip: (page - 1) * limit };
}

export function paginationError() {
  return { error: "Invalid pagination parameters. page must be >= 1, limit must be 1-100." };
}
