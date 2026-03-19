import { supabase } from "./supabase";

export async function getOrCreateProfile(user, fallbackState) {
  const { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const newProfile = {
    id: user.id,
    name: user.user_metadata?.name || fallbackState.profile?.name || "",
    grade: fallbackState.profile?.grade || 5,
    level: fallbackState.game?.level || 1,
    xp: fallbackState.game?.xp || 0,
    points: fallbackState.game?.points || 0,
    meteor_best: fallbackState.arcade?.meteorBest || 0,
    app_state: fallbackState,
  };

  const { data: createdProfile, error: createError } = await supabase
    .from("profiles")
    .insert(newProfile)
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  return createdProfile;
}

export async function saveProfile(userId, state) {
  const payload = {
    id: userId,
    name: state.profile?.name || "",
    grade: state.profile?.grade || 5,
    level: state.game?.level || 1,
    xp: state.game?.xp || 0,
    points: state.game?.points || 0,
    meteor_best: state.arcade?.meteorBest || 0,
    app_state: state,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw error;
  }
}