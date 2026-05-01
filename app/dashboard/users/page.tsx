import { prisma } from "@/lib/prisma";
import UserList, { type UserData } from "./components/UserList";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <UserList initialData={users as UserData[]} />;
}
