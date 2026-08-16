-- CreateTable
CREATE TABLE "ChatAnalytic" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "message" TEXT NOT NULL,
    "carsShown" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatAnalytic_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChatAnalytic" ADD CONSTRAINT "ChatAnalytic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
