// ─────────────────────────────────────────────────────────────
// Financial Record Service
// ─────────────────────────────────────────────────────────────
// handles creating, finding, updating, and (soft) deleting 
// money records. also does the heavy lifting for filtering.
// ─────────────────────────────────────────────────────────────

import {
  CreateRecordInput,
  UpdateRecordInput,
  ListRecordsQuery,
} from "../validators/record.validator";

// dynamically pulling Prisma so the IDE types don't get confused
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * adds a new income or expense record to the DB.
 */
export const createRecord = async (
  data: CreateRecordInput,
  createdById: string
) => {
  return prisma.financialRecord.create({
    data: {
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: new Date(data.date),
      notes: data.notes ?? null,
      createdById,
    },
    // bring back the user info so the frontend doesn't have to guess
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

/**
 * grabs a list of records based on whatever filters the frontend sends.
 * ignores deleted stuff automatically.
 */
export const listRecords = async (query: ListRecordsQuery) => {
  const { type, category, startDate, endDate, page, limit } = query;

  // start with a base filter: no deleted records allowed
  const where: Record<string, unknown> = {
    isDeleted: false,
  };

  // tack on extra filters if they asked for them
  if (type) {
    where.type = type;
  }
  if (category) {
    where.category = { contains: category, mode: "insensitive" }; // case-insensitive search is just nicer
  }
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    where.date = dateFilter;
  }

  // math time: figure out which slice of data we need for this page
  const currentPage: number = page;
  const currentLimit: number = limit;
  const skip: number = (currentPage - 1) * currentLimit;

  // fetch the records AND the total count at the same time so we're not waiting around
  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip,
      take: currentLimit,
      orderBy: { date: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  // package it all up with nice pagination metadata
  return {
    records,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    },
  };
};

/**
 * grabs exactly one record if it exists (and isn't deleted).
 */
export const getRecordById = async (id: string) => {
  const record = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // couldn't find it? bail out
  if (!record) {
    throw Object.assign(new Error("Financial record not found"), {
      statusCode: 404,
    });
  }

  return record;
};

/**
 * tweaks an existing record (Admins only, enforced in the route).
 */
export const updateRecord = async (id: string, data: UpdateRecordInput) => {
  // make sure it actually exists before we try to change it
  const existing = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
  });

  if (!existing) {
    throw Object.assign(new Error("Oops, couldn't find that record"), {
      statusCode: 404,
    });
  }

  // only update the fields they actually sent us
  const updateData: Record<string, unknown> = {};
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.notes !== undefined) updateData.notes = data.notes;

  return prisma.financialRecord.update({
    where: { id },
    data: updateData,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

/**
 * pretends to delete a record by flipping the isDeleted switch.
 */
export const deleteRecord = async (id: string) => {
  // double check it's still there first
  const existing = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
  });

  // already gone or never existed?
  if (!existing) {
    throw Object.assign(new Error("Record doesn't exist or was already deleted"), {
      statusCode: 404,
    });
  }

  // just flip the flag, keep the data safe
  return prisma.financialRecord.update({
    where: { id },
    data: { isDeleted: true },
  });
};
