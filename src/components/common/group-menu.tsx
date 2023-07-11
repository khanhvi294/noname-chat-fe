'use client';
import { Form, Input, Modal, Radio, Space, Button } from 'antd';
import { Report, ReportType } from '@/types/report';
import { Avatar } from '@/components/common/avatar';

import { useForm } from 'antd/lib/form/Form';
import { useState, useEffect } from 'react';
import { GroupName } from '../room/room-name';
import { Room } from '@/types/room';
import GroupEdit from '../group/group-edit';
import { EditFilled } from '@ant-design/icons';
import GroupMember from '../group/group-member';
import AddMember from '../group/add-member';
import { UserStore, useUserStore } from '@/stores/user/user-store';

type GroupMenuModalProps = {
  room?: Room | undefined;
  open: boolean;
  onCancel: () => void;
  onSubmit: (report: Pick<Report, 'type' | 'description'>) => void;
};

const GroupMenuModal: React.FC<GroupMenuModalProps> = ({ room, open, onCancel, onSubmit }) => {
  const [form] = useForm();
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState(room?.name);
  const [croppedFile, setCroppedFile] = useState<Blob | undefined>(undefined);
  const [isEditGroup, setIsEditGroup] = useState(false);
  const [isAddMember, setIsAddMember] = useState(false);
  const currentUser = useUserStore((state: UserStore) => state.data!);

  const [test, setTest] = useState(false);
  useEffect(() => {
    setTest(true);
  }, [room]);

  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      onSubmit(values);
      form.resetFields();
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <Modal
      style={{ top: 20 }}
      width={500}
      open={open}
      onCancel={onCancel}
      footer={null}
      confirmLoading={loading}
    >
      {!isEditGroup && !isAddMember ? (
        <>
          <HeaderGroup setIsEditGroup={setIsEditGroup} room={room} />
          {/* {console.log('modal ', room)} */}
          {room?.isAdmin ? (
            <Button className="mt-3" type="primary" onClick={() => setIsAddMember(true)}>
              Add member{' '}
            </Button>
          ) : (
            ''
          )}

          <GroupMember room={room} />
        </>
      ) : (
        ''
      )}
      {isEditGroup ? <GroupEdit isOpen={isEditGroup} setIsOpen={setIsEditGroup} room={room} /> : ''}

      {isAddMember ? <AddMember room={room} setIsAddMember={setIsAddMember} /> : ''}
    </Modal>
  );
};

export default GroupMenuModal;

export const HeaderGroup = ({
  setIsEditGroup,
  room,
}: {
  setIsEditGroup: (isEdit: boolean) => void;
  room: Room | undefined;
}) => {
  return (
    <div>
      <div className="flex">
        <Avatar bordered src={room?.avatar} size="xLarge" alt={room?.name} />
        <div className="ml-4">
          <p className="text-2xl font-bold"> {room?.name} </p>
          <p className="text-md"> {room?.participants.length} members </p>
        </div>
        <div className="ml-5">
          <Button
            type="primary"
            shape="circle"
            icon={<EditFilled />}
            size={'large'}
            onClick={() => {
              setIsEditGroup(true);
            }}
          />
        </div>
      </div>
    </div>
  );
};
