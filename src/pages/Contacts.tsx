import { useState } from "react";
import { Alert, Button, Empty, Input, Pagination, Select, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { useFriends } from "../hooks/useFriends";
import { useSocial } from "../hooks/useSocial";
import ProfileSummary from "../components/social/ProfileSummary";
export default function Contacts() {
  const social = useSocial();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const { data, error, loading } = useFriends(query, status, page);
  if (social.error && !social.capabilities)
    return (
      <div className="p-8">
        <Alert
          type="error"
          message={social.error}
          action={<Button onClick={social.refresh}>重试</Button>}
        />
      </div>
    );
  if (!social.capabilities)
    return (
      <div className="p-8">
        <Spin />
      </div>
    );
  if (!social.capabilities.friends)
    return (
      <div className="p-8">
        <Alert message="好友功能暂未启用" />
      </div>
    );
  return (
    <section
      className="flex-1 overflow-auto p-6 md:p-10 text-white"
      aria-label="通讯录"
    >
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-2xl font-semibold">通讯录</h1>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/contacts/requests")}>
            好友申请{" "}
            {social.summary.receivedPendingFriendRequests > 0 &&
              `(${social.summary.receivedPendingFriendRequests})`}
          </Button>
          <Button type="primary" onClick={() => social.openAddFriend()}>
            添加好友
          </Button>
        </div>
      </div>
      <div className="flex gap-3 mb-6">
        <Input
          aria-label="搜索好友"
          placeholder="搜索好友昵称、用户名或ID"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          allowClear
        />
        <Select
          aria-label="好友在线状态"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          style={{ minWidth: 120 }}
          options={[
            { value: "all", label: "全部状态" },
            { value: "online", label: "在线" },
            { value: "away", label: "离开" },
            { value: "busy", label: "忙碌" },
            { value: "offline", label: "离线" },
          ]}
        />
      </div>
      {error && (
        <Alert
          className="mb-4"
          type="error"
          message={error}
          action={<Button onClick={social.refresh}>重试</Button>}
        />
      )}
      {loading && <Spin />}
      {!loading && !error && !data.list.length && (
        <Empty
          description={
            query ? "没有匹配的好友" : "还没有好友，添加好友后会出现在这里"
          }
        />
      )}
      <div className="space-y-3">
        {data.list.map((contact) => (
          <button
            key={contact.profile.userId}
            onClick={() => navigate(`/contacts/${contact.profile.userId}`)}
            className="w-full text-left rounded-xl bg-gray-800/60 hover:bg-gray-800 p-4 border-0"
            data-testid={`contact-${contact.profile.userId}`}
          >
            <ProfileSummary profile={contact.profile} />
            <p className="text-sm text-gray-400 mt-3 truncate">
              {contact.profile.signature}
            </p>
          </button>
        ))}
      </div>
      {data.total > 20 && (
        <Pagination
          className="mt-6"
          current={page}
          pageSize={20}
          total={data.total}
          onChange={setPage}
          showSizeChanger={false}
        />
      )}
    </section>
  );
}
