"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile } from "fs/promises";
import { join } from "path";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function createVenue(formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const location = formData.get("location") as string;
  const image = formData.get("image") as File | null;
  let imageUrl: string | null = null;

  if (image && image.size > 0) {
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const path = join(process.cwd(), 'public/uploads', filename);
    
    await writeFile(path, buffer);
    imageUrl = `/uploads/${filename}`;
  }

  if (!name || !location) {
    throw new Error("Missing required fields");
  }

  await prisma.venue.create({
    data: { 
      name, 
      location,
      ...(imageUrl ? { imageUrl } : {}) 
    },
  });

  revalidatePath("/admin/venues");
  revalidatePath("/");
}

export async function deleteVenue(venueId: string) {
  await requireAdmin();

  await prisma.venue.delete({
    where: { id: venueId },
  });

  revalidatePath("/admin/venues");
  revalidatePath("/");
}

export async function createSlot(formData: FormData) {
  await requireAdmin();

  const venueId = formData.get("venueId") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const capacity = parseInt(formData.get("capacity") as string, 10);

  if (!venueId || !startTime || !endTime || isNaN(capacity)) {
    throw new Error("Missing required fields");
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    throw new Error("Start time must be before end time");
  }

  // Overlap check
  const overlappingSlots = await prisma.slot.findMany({
    where: {
      venueId,
      OR: [
        {
          startTime: { lt: end },
          endTime: { gt: start },
        },
      ],
    },
  });

  if (overlappingSlots.length > 0) {
    throw new Error("This slot overlaps with an existing slot for this venue");
  }

  await prisma.slot.create({
    data: {
      venueId,
      startTime: start,
      endTime: end,
      capacity,
    },
  });

  revalidatePath(`/admin/venues/${venueId}`);
  revalidatePath("/admin/venues");
  revalidatePath("/");
}

export async function deleteSlot(slotId: string, venueId: string) {
  await requireAdmin();

  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
  });

  if (!slot) {
    throw new Error("Slot not found");
  }

  if (slot.bookedCount > 0) {
    throw new Error("Cannot delete a slot that has active bookings.");
  }

  await prisma.slot.delete({
    where: { id: slotId },
  });

  revalidatePath(`/admin/venues/${venueId}`);
  revalidatePath("/admin/venues");
  revalidatePath("/");
}
