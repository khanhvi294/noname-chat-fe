import { Dropdown, MenuProps, Upload, UploadFile, UploadProps } from 'antd';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import {
  FileImageOutlined,
  FileTextOutlined,
  LinkOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';

import { MessageType } from '@/types/message';
import { RcFile } from 'antd/es/upload';
import { messageApi } from '@/services/message-services';
import { uploadImage } from '@/utils/upload-image';
import { useMutation } from '@tanstack/react-query';

type Props = {
  roomId: string;
  flag: boolean;
  setRoomId: React.Dispatch<React.SetStateAction<string>>;
};

const MessageFooter = (props: Props) => {
  const [inputChat, setInputChat] = useState('');
  const [displayEmoji, setDisplayEmoji] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputElement = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [selectType, setSelectType] = useState(MessageType.TEXT);
  const labelImage = useRef<HTMLButtonElement>(null);
  const labelFile = useRef<HTMLButtonElement>(null);
  const pickerEmoji = (emoji: string) => {
    inputElement?.current?.focus();
    const currentPosition = inputElement?.current?.selectionStart ?? 0;
    let message =
      inputChat.substring(0, currentPosition) + emoji + inputChat.substring(currentPosition);
    setInputChat(message);
    setCursorPosition(currentPosition + emoji.length);
  };

  useEffect(() => {
    const currentInputElement = inputElement.current;
    if (currentInputElement) {
      currentInputElement.selectionEnd = cursorPosition;
    }
    // inputElement?.current?.selectionEnd = cursorPosition ?? 0;
    inputElement?.current?.focus();
  }, [cursorPosition]);
  const sendFileItem: MenuProps['items'] = [
    {
      key: '1',
      label: 'Send image',
      icon: <FileImageOutlined />,
    },
    {
      key: '2',
      label: 'send file',
      icon: <FileTextOutlined />,
    },
  ];
  const onClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case '1':
        setSelectType(MessageType.IMAGE);
        break;
      case '2':
        setSelectType(MessageType.FILE);
        break;
    }
  };

  const emojiStyle: EmojiStyle = EmojiStyle.NATIVE;

  const mutation = useMutation({
    mutationFn: messageApi.createMessage,
    onSuccess: (message) => {
      console.log('mess', message.room);
      console.log(props.flag);
      if (!props.flag && !!message) {
        props.setRoomId(message.room || '');
      }
    },
  });
  const [imageList, setImageList] = useState<UploadFile[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const onChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    console.log('new', newFileList);
    setImageList(newFileList);
  };
  const onChangeFile: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    console.log('new', newFileList);
    setFileList(newFileList);
  };
  const onPreview = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as RcFile);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };
  useMemo(() => {
    if (fileList.length === 0) setSelectType(MessageType.TEXT);
  }, [fileList]);
  useMemo(() => {
    if (imageList.length === 0) setSelectType(MessageType.TEXT);
  }, [imageList]);
  useEffect(() => {
    if (selectType === MessageType.IMAGE && labelImage.current) labelImage.current.click();
    else if (selectType === MessageType.FILE && labelFile.current) labelFile.current.click();
  }, [selectType]);

  type fileType = {
    link: any;
    name: any;
  };
  const submitImage = async (list: UploadFile[]) => {
    let listImage: string[] = [];
    if (list.length > 0) {
      const resultPromise: any = [];
      list.forEach((file) => resultPromise.push(uploadImage(file.originFileObj as Blob)));
      const result = await Promise.all(resultPromise);
      listImage = result.map((image) => image.secure_url);
    }
    return listImage;
  };
  const submitFile = async (list: UploadFile[]) => {
    let listFile: fileType[] = [];
    if (list.length > 0) {
      const resultPromise: any = [];
      list.forEach((file) => resultPromise.push(uploadImage(file.originFileObj as Blob)));
      const result = await Promise.all(resultPromise);
      listFile = result.map((file) => ({
        link: file.secure_url,
        name: file.original_filename,
      }));
    }
    return listFile;
  };

  const handleEnter = async () => {
    let type = MessageType.TEXT;
    let listImage: string[] = [];
    let listFile: fileType[] = [];
    if (selectType === MessageType.IMAGE) {
      type = MessageType.IMAGE;
      listImage = await submitImage(imageList);
    } else if (selectType === MessageType.FILE) {
      type = MessageType.FILE;
      console.log(fileList);
      listFile = await submitFile(fileList);
    }
    console.log('check', props.roomId);
    const message = {
      content: inputElement?.current?.value,
      type: type,
      room: props.roomId,
      images: type === MessageType.IMAGE ? listImage : [],
      files: type === MessageType.FILE ? listFile : [],
    };
    const mess = {
      message,
      isNotTemp: props.flag,
    };
    mutation.mutate(mess);
    setInputChat('');
    setFileList([]);
    setImageList([]);
    setSelectType(MessageType.TEXT);
  };
  return (
    <div className="px-4 w-full max-w-[730px]">
      <div className="custom mb-5 mt-2 h-fit  flex-shrink-0  rounded-lg bg-white">
        <div className=" flex min-h-[56px] w-full items-center">
          <div className="relative flex h-9 w-14 items-center justify-center" ref={emojiPickerRef}>
            <div
              onMouseEnter={() => {
                inputElement?.current?.focus();
                setDisplayEmoji(true);
              }}
              onMouseLeave={() => {
                inputElement?.current?.focus();
                setDisplayEmoji(false);
              }}
            >
              <SmileOutlined className="cursor:cursor-pointer text-[22px] text-gray-500" />
            </div>
            {displayEmoji && (
              <div className="absolute bottom-14 left-0 z-10 drop-shadow-xl">
                <EmojiPicker
                  onEmojiClick={(emoji: { emoji: string }) => pickerEmoji(emoji.emoji)}
                  emojiStyle={emojiStyle}
                  autoFocusSearch={false}
                />
              </div>
            )}
          </div>
          <div className="block h-fit flex-1 ">
            {selectType === MessageType.IMAGE && (
              <Upload
                listType="picture-card"
                accept="image/png, image/jpeg"
                fileList={imageList}
                onChange={onChange}
                onPreview={onPreview}
                beforeUpload={() => false}
              >
                <button type="button" ref={labelImage}>
                  + Upload
                </button>
              </Upload>
            )}
            {selectType === MessageType.FILE && (
              <Upload
                action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                listType="picture-card"
                className="flex gap-12 "
                accept=".pdf, .txt, .docx, .pptx"
                onChange={onChangeFile}
                beforeUpload={() => false}
              >
                <button type="button" ref={labelFile}>
                  + Upload
                </button>
              </Upload>
            )}

            <input
              placeholder="Message"
              className="block h-12 w-full text-black focus:outline-none"
              value={inputChat}
              onChange={(e) => {
                setInputChat(e.target.value);
              }}
              ref={inputElement}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEnter();
                }
              }}
            />
          </div>

          <div className="relative flex h-9 w-14 items-center justify-center">
            <Dropdown
              overlayClassName="w-40"
              menu={{ items: sendFileItem, onClick }}
              placement="topRight"
            >
              <LinkOutlined className="text-[22px] text-gray-500 hover:cursor-pointer hover:text-cyan-600" />
            </Dropdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageFooter;
