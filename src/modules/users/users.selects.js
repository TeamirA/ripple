// Column sets shared by every query that returns users. None include passwordHash.

export const USER_SUMMARY_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
};

export const USER_PROFILE_SELECT = {
  ...USER_SUMMARY_SELECT,
  bio: true,
  bannerColor: true,
  postsCount: true,
  followersCount: true,
  followingCount: true,
  createdAt: true,
};

export const USER_SELF_SELECT = {
  ...USER_PROFILE_SELECT,
  email: true,
};
