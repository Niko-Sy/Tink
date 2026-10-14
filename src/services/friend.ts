import { apiRequest } from "./api";
import type { PaginatedResponse } from "./api";
import type {
  FriendContact,
  FriendRequest,
  PublicUserProfile,
  Relationship,
  RequestResult,
  SocialCapabilities,
  SocialSummary,
  UserSearchResult,
} from "../types/social";
export const friendService = {
  capabilities: () =>
    apiRequest.get<SocialCapabilities>("/users/me/social-capabilities"),
  summary: () => apiRequest.get<SocialSummary>("/users/me/social-summary"),
  search: (query: { userId?: string; username?: string }) =>
    apiRequest.get<UserSearchResult[]>("/users/search", query),
  profile: (userId: string) =>
    apiRequest.get<PublicUserProfile>(`/users/${userId}/info`),
  relationship: (userId: string) =>
    apiRequest.get<Relationship>(`/users/${userId}/relationship`),
  create: (toUserId: string, message: string) =>
    apiRequest.post<RequestResult>("/friends/requests", { toUserId, message }),
  requests: (options: {
    direction: "received" | "sent";
    status: string;
    page: number;
    pageSize: number;
  }) =>
    apiRequest.get<PaginatedResponse<FriendRequest>>(
      "/users/me/friend-requests",
      options,
    ),
  handle: (requestId: string, action: "accept" | "reject" | "cancel") =>
    apiRequest.post<RequestResult>(
      `/friends/requests/${requestId}/${action}`,
      {},
    ),
  friends: (options: {
    q: string;
    status: string;
    page: number;
    pageSize: number;
  }) =>
    apiRequest.get<PaginatedResponse<FriendContact>>(
      "/users/me/friends",
      options,
    ),
  contact: (userId: string) =>
    apiRequest.get<FriendContact>(`/friends/${userId}`),
  remove: (userId: string) =>
    apiRequest.delete<{ removed: boolean }>(`/friends/${userId}`),
};
