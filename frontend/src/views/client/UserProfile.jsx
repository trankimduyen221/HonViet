/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMail, FiCamera } from 'react-icons/fi';
import {
    Box,
    Flex,
    Text,
    Button,
    Image,
    Badge,
    Spinner,
    useToast,
    HStack,
    Center,
    Input,
    VStack,
    FormControl,
    FormLabel,
    InputGroup,
    InputLeftElement,
    Avatar
} from '@chakra-ui/react';
import axios from 'axios';

import logoLotus from '../../assets/logo.jpg';

export default function UserProfile() {
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        role: '',
        avatar: ''
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // State tạm thời để hiển thị ảnh xem trước và giữ file khi chọn
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const toast = useToast();

    const omegaGreen = '#930a0a';
    const omegaGrayBg = '#F5F5F5';

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

    // 1. TẢI THÔNG TIN CÁ NHÂN
    useEffect(() => {
        if (!token) {
            toast({
                title: 'Yêu cầu đăng nhập',
                description: 'Vui lòng đăng nhập để xem thông tin cá nhân!',
                status: 'warning',
                position: 'top'
            });
            navigate('/client/auth');
            return;
        }

        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:8080/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setProfile({
                    username: response.data.username || '',
                    email: response.data.email || '',
                    role: response.data.role || 'USER',
                    avatar: response.data.avatar || ''
                });
            } catch (err) {
                console.error('Lỗi tải thông tin cá nhân:', err);
                toast({
                    title: 'Lỗi đồng bộ',
                    description: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
                    status: 'error',
                    position: 'top'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [token, navigate]);

    // Xử lý khi chọn file từ máy tính
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    // 2. QUY TRÌNH LƯU THÔNG TIN (ĐỒNG BỘ LOCALSTORAGE VÀ STATE)
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let currentAvatarUrl = profile.avatar;

            // BƯỚC A: Nếu có chọn ảnh đại diện mới -> Gọi API upload riêng (Hàm số 8 trong Backend)
            if (avatarFile) {
                const imageFormData = new FormData();
                imageFormData.append('file', avatarFile); // Đúng key @RequestParam("file")

                const uploadResponse = await axios.post('http://localhost:8080/api/users/me/avatar', imageFormData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                // Nhận URL ảnh mới từ server trả về
                if (uploadResponse.data && uploadResponse.data.avatar) {
                    currentAvatarUrl = uploadResponse.data.avatar;
                }
            }

            // BƯỚC B: Gửi cập nhật thông tin chữ qua JSON lên API cập nhật (Hàm số 5 trong Backend)
            const response = await axios.put('http://localhost:8080/api/users/me', {
                username: profile.username,
                email: profile.email,
                avatar: currentAvatarUrl // Truyền link ảnh sang để Backend đồng bộ vào DB
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json' // Định dạng JSON gốc
                }
            });

            // Cập nhật lại UI cục bộ của trang Profile
            setProfile(prev => ({ ...prev, avatar: currentAvatarUrl, username: profile.username }));
            setAvatarFile(null);
            setAvatarPreview(null);

            // 🔥 ĐỒNG BỘ VÀO LOCALSTORAGE ĐỂ TRANG CHỦ / HEADER LẤY ĐƯỢC NGAY LẬP TỨC
            localStorage.setItem('username', profile.username);
            localStorage.setItem('avatar', currentAvatarUrl);

            // Phát tín hiệu thông báo cho các component khác cập nhật giao diện (nếu có lắng nghe)
            window.dispatchEvent(new Event('storage'));

            toast({
                title: 'Thành công!',
                description: 'Thông tin hồ sơ và ảnh đại diện đã được cập nhật.',
                status: 'success',
                position: 'top',
                duration: 2000
            });
        } catch (err) {
            console.error('Lỗi quy trình lưu hồ sơ:', err);
            toast({
                title: 'Cập nhật thất bại',
                description: err.response?.data || 'Đã có lỗi xảy ra, vui lòng thử lại.',
                status: 'error',
                position: 'top'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Center minH="100vh" flexDirection="column" gap={3}>
                <Spinner size="xl" color={omegaGreen} thickness="4px" />
                <Text fontWeight="semibold" color="gray.600">Đang tải hồ sơ tài khoản...</Text>
            </Center>
        );
    }

    const displayRole = (profile.role || 'USER').toUpperCase();

    return (
        <Box bg="white" minH="100vh">
            <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;900&family=Quicksand:wght@600;700;900&display=swap" rel="stylesheet" />

            {/* Banner thương hiệu */}
            <Box bg={omegaGreen} color="white" py="10px" textAlign="center" fontSize="13px" fontWeight="bold" letterSpacing="1.5px">
                HỒN VIỆT — MỸ VỊ CHÍNH THỐNG ĐẬM ĐÀ QUÊ HƯƠNG
            </Box>

            {/* Header */}
            <Box bg="white" borderBottom="1px solid #EDEDED" py="12px" px={{ base: '15px', md: '30px' }}>
                <Flex maxW="1000px" mx="auto" align="center" justify="space-between">
                    <HStack spacing="12px" cursor="pointer" onClick={() => navigate('/client/food-menu')}>
                        <Image src={logoLotus} alt="Hon Viet Logo" boxSize="50px" objectFit="contain" />
                        <Box>
                            <Text fontSize="18px" fontFamily='"Comfortaa", "Quicksand", sans-serif' fontWeight="900" color={omegaGreen} lineHeight="none">
                                HỒN VIỆT
                            </Text>
                            <Text fontSize="9px" color="gray.500" fontWeight="bold" mt="2px">SINCE 2026</Text>
                        </Box>
                    </HStack>

                    <Button
                        leftIcon={<FiArrowLeft />}
                        variant="ghost"
                        fontSize="13px"
                        fontWeight="700"
                        color="gray.600"
                        _hover={{ color: omegaGreen }}
                        onClick={() => navigate('/client/food-menu')}
                    >
                        Quay lại Thực đơn
                    </Button>
                </Flex>
            </Box>

            {/* Breadcrumb */}
            <Box bg={omegaGrayBg} py="10px" px={{ base: '15px', md: '30px' }}>
                <HStack maxW="1000px" mx="auto" fontSize="12px" color="gray.500" fontWeight="600">
                    <Text cursor="pointer" onClick={() => navigate('/client/food-menu')}>Trang chủ</Text>
                    <Text>/</Text>
                    <Text color="gray.800">Thông tin cá nhân</Text>
                </HStack>
            </Box>

            {/* Khung nội dung Form chỉnh sửa */}
            <Box maxW="600px" mx="auto" mt={{ base: '30px', md: '40px' }} px="15px" pb="60px">
                <Box border="1px solid #EAEAEA" p={{ base: '20px', md: '35px' }} bg="white" borderRadius="0px" boxShadow="0 4px 20px rgba(0,0,0,0.02)">

                    <VStack spacing="5px" align="center" mb="25px">
                        <Text fontSize="20px" fontFamily='"Comfortaa", sans-serif' fontWeight="900" color="#222">
                            THÔNG TIN TÀI KHOẢN
                        </Text>
                        <Text fontSize="12px" color="gray.500" fontWeight="600">
                            Quản lý thông tin bảo mật và hồ sơ cá nhân của bạn
                        </Text>
                    </VStack>

                    <form onSubmit={handleUpdateProfile}>
                        <VStack spacing="20px" align="stretch">

                            {/* Khu vực thay đổi Avatar */}
                            <Center flexDir="column" mb="10px">
                                <Box position="relative" role="group" cursor="pointer" onClick={() => fileInputRef.current.click()}>
                                    <Avatar
                                        size="2xl"
                                        name={profile.username}
                                        src={avatarPreview || profile.avatar}
                                        border="3px solid"
                                        borderColor={omegaGreen}
                                        objectFit="cover" //bo viền ảnh
                                    />
                                    <Box
                                        position="absolute"
                                        top={0}
                                        left={0}
                                        right={0}
                                        bottom={0}
                                        bg="blackAlpha.600"
                                        borderRadius="full"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        opacity={0}
                                        _groupHover={{ opacity: 1 }}
                                        transition="all 0.2s"
                                    >
                                        <FiCamera color="white" size="24px" />
                                    </Box>
                                </Box>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <Text fontSize="11px" color="gray.400" fontWeight="bold" mt="8px">
                                    Nhấp vào ảnh để thay đổi avatar
                                </Text>
                            </Center>

                            {/* Tên tài khoản */}
                            <FormControl isRequired>
                                <FormLabel fontSize="11px" fontWeight="800" color="gray.700" textTransform="uppercase" mb="8px">
                                    Tên hiển thị (Username)
                                </FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents="none">
                                        <FiUser color="gray.400" />
                                    </InputLeftElement>
                                    <Input
                                        type="text"
                                        fontSize="13px"
                                        fontWeight="600"
                                        borderRadius="0px"
                                        focusBorderColor={omegaGreen}
                                        value={profile.username}
                                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                    />
                                </InputGroup>
                            </FormControl>

                            {/* Địa chỉ Email */}
                            <FormControl isRequired>
                                <FormLabel fontSize="11px" fontWeight="800" color="gray.700" textTransform="uppercase" mb="8px">
                                    Địa chỉ Email
                                </FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents="none">
                                        <FiMail color="gray.400" />
                                    </InputLeftElement>
                                    <Input
                                        type="email"
                                        fontSize="13px"
                                        fontWeight="600"
                                        borderRadius="0px"
                                        focusBorderColor={omegaGreen}
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    />
                                </InputGroup>
                            </FormControl>

                            {/* Quyền hạn thành viên */}
                            <FormControl>
                                <FormLabel fontSize="11px" fontWeight="800" color="gray.700" textTransform="uppercase" mb="8px">
                                    Nhóm quyền hiện tại
                                </FormLabel>
                                <Box bg="gray.50" p="10px" border="1px solid #EAEAEA" display="flex" alignItems="center" justifyContent="space-between">
                                    <Badge
                                        colorScheme={displayRole === 'ADMIN' ? 'purple' : displayRole === 'SHIPPER' ? 'blue' : 'green'}
                                        px="8px" py="2px" borderRadius="0px" fontSize="10px" fontWeight="800"
                                    >
                                        {displayRole}
                                    </Badge>
                                    <Text fontSize="10px" color="gray.400" fontWeight="700">* Liên hệ Admin nếu muốn nâng cấp quyền</Text>
                                </Box>
                            </FormControl>

                            {/* Nút lưu */}
                            <Button
                                type="submit"
                                bg={omegaGreen}
                                color="white"
                                size="lg"
                                fontSize="13px"
                                fontWeight="800"
                                borderRadius="0px"
                                h="48px"
                                mt="10px"
                                _hover={{ bg: '#730808' }}
                                isLoading={submitting}
                                loadingText="ĐANG LƯU THAY ĐỔI..."
                            >
                                LƯU CẬP NHẬT HỒ SƠ
                            </Button>

                        </VStack>
                    </form>
                </Box>
            </Box>

            {/* Footer */}
            <Box bg="white" borderTop="1px solid #EAEAEA" py="20px" textAlign="center" fontSize="11px" color="gray.400" fontWeight="bold">
                Copyright © 2026 honvietfoods. Powered by Yuri Project
            </Box>
        </Box>
    );
}