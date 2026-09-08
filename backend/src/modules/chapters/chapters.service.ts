import prisma from '../../config/database';

export interface CreateChapterInput {
  title: string;
  titleAr?: string;
  description?: string;
  order?: number;
  price?: number;
  isFree?: boolean;
}

export interface UpdateChapterInput extends Partial<CreateChapterInput> {}

export const chaptersService = {
  async listByCourse(courseId: string) {
    return prisma.chapter.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { lessons: true } },
      },
    });
  },

  async create(courseId: string, userId: string, input: CreateChapterInput) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course || course.instructorId !== userId) return null;

    const maxOrder = await prisma.chapter.aggregate({
      where: { courseId },
      _max: { order: true },
    });
    const order = input.order ?? (maxOrder._max.order ?? -1) + 1;

    return prisma.chapter.create({
      data: {
        ...input,
        courseId,
        order,
      },
    });
  },

  async update(id: string, userId: string, input: UpdateChapterInput) {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!chapter || chapter.course.instructorId !== userId) return null;

    return prisma.chapter.update({
      where: { id },
      data: input,
    });
  },

  async delete(id: string, userId: string) {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!chapter || chapter.course.instructorId !== userId) return null;

    await prisma.chapter.delete({ where: { id } });
    return true;
  },

  async reorder(id: string, userId: string, order: number) {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!chapter || chapter.course.instructorId !== userId) return null;

    const courseId = chapter.courseId;
    const chapters = await prisma.chapter.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });

    const fromIndex = chapters.findIndex((c) => c.id === id);
    if (fromIndex === -1) return null;

    const reordered = [...chapters];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(order, 0, removed);

    await prisma.$transaction(
      reordered.map((ch, idx) =>
        prisma.chapter.update({
          where: { id: ch.id },
          data: { order: idx },
        })
      )
    );

    return prisma.chapter.findUnique({
      where: { id },
    });
  },
};
