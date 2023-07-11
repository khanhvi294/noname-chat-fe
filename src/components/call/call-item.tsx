'use client';

import { ArrowLeftOutlined, DeleteOutlined, PhoneOutlined } from '@ant-design/icons';
import { Button, Popconfirm, message as messageAntd } from 'antd';
import { Call, CallStatus } from '@/types/call';
import { UserStore, useUserStore } from '@/stores/user';
import { cn, extractRoomByCurrentUser } from '@/utils';

import { Avatar } from '../common/avatar';
import Link from 'next/link';
import { Message } from '@/types/message';
import { User } from '@/types/user';
import { generateRoomLink } from '@/utils/link';
import { messageApi } from '@/services/message-services';
import { useCreateCall } from '@/hooks/call/use-create-call';
import { useMutation } from '@tanstack/react-query';
import { useWindowCall } from '@/hooks/call';

export interface CallItemProps {
  message: Message;
  onDeleted?: (call: Call) => void;
}

export const CallItem = ({ message, onDeleted }: CallItemProps) => {
  const call = message.call!;
  const user = useUserStore((state: UserStore) => state.data);
  const room = extractRoomByCurrentUser(call.room, user!);
  const isCaller = call!.caller._id === user?._id;
  const status = genStatusOfUserByCall(call!, user!);
  const isNegative = status === 'rejected' || status === 'missed';

  const { openWindowCall } = useWindowCall();

  const { mutate, isLoading } = useCreateCall({
    onSuccess(data, variables) {
      openWindowCall(variables, data.data._id);
    },
  });

  const { mutate: deleteMessage, isLoading: deleteLoading } = useMutation({
    mutationFn: messageApi.deleteMessage,
    onSuccess: (_, id) => {
      messageAntd.success('Delete message successfully');
      onDeleted?.(call);
    },
  });

  return (
    <Link
      href={generateRoomLink(room._id)}
      className="group/item flex items-center rounded-lg p-2 hover:bg-slate-200"
    >
      <Avatar src={room.avatar} size="medium" />
      <div className="ml-4 flex-1 overflow-hidden">
        <h3 className="line-clamp-1 font-bold">{room.name}</h3>
        <div className="flex items-center gap-1 text-base">
          <ArrowLeftOutlined
            rotate={isCaller ? 135 : -45}
            className={cn('mt-1', isNegative ? 'text-red-500' : 'text-green-500')}
          />{' '}
          <span className="capitalize">{status}</span>&#x2022;
          <span>
            {new Date(call.createdAt).toLocaleString('en-US', {
              timeStyle: 'short',
            })}
          </span>
        </div>
      </div>
      <div className="ml-auto">
        <Popconfirm
          title="Delete this call?"
          description="
            This action cannot be undone."
          onCancel={(e) => {
            e!.stopPropagation();
            e!.preventDefault();
          }}
          onConfirm={(e) => {
            e!.stopPropagation();
            e!.preventDefault();
            deleteMessage(message._id);
          }}
          okText="Yes"
          cancelText="No"
        >
          <Button
            loading={deleteLoading}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            shape="circle"
            type="text"
            danger
            size="large"
            className="invisible transition-all group-hover/item:visible"
            icon={<DeleteOutlined />}
          />
        </Popconfirm>

        <Button
          loading={isLoading}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            mutate(room._id);
          }}
          shape="circle"
          type="text"
          size="large"
          icon={<PhoneOutlined />}
        />
      </div>
    </Link>
  );
};

type UserCallStatus = 'accepted' | 'rejected' | 'missed' | 'pending';

function genStatusOfUserByCall(call: Call, user: User): UserCallStatus {
  if (call.acceptedUsers.some((u) => u._id === user._id)) {
    return 'accepted';
  }
  if (call.rejectedUsers.some((u) => u._id === user._id)) {
    return 'rejected';
  }
  if (call.status === CallStatus.ENDED) {
    return 'missed';
  }
  return 'pending';
}
