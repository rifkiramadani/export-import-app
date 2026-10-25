import { notFound } from "next/navigation";
import { getCategories } from "@/services/master";
import { fetchPublicProfile } from "./services/profile-detail";
import ProfileDetailClient from "./_components/profile-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;

  const [profile, categories] = await Promise.all([
    fetchPublicProfile(id),
    getCategories(),
  ]);

  if (!profile) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileDetailClient profile={profile} categories={categories} />
    </div>
  );
}
