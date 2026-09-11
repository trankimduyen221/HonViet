/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import {
    Box, Flex, Text, Input, Select, Textarea, Button, Image,
    Table, Tbody, Td, Th, Thead, Tr, VStack, HStack, useToast, Icon,
    Center, Spinner, IconButton,
    // --- TÍCH HỢP CHAKRA UI MENU ĐỒNG BỘ ---
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Avatar,
    MenuDivider
} from '@chakra-ui/react';
import { MdEdit, MdDelete, MdCloudUpload, MdClose } from 'react-icons/md';

// Import chính xác các tài nguyên hình ảnh đồng bộ như LoginRegister
import logoLotus from "../../assets/logo.jpg";

export default function FoodManager() {
    const [foods, setFoods] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const navigate = useNavigate();

    // Hệ màu sắc nhận diện thương hiệu phẳng Hòn Việt
    const omegaGreen = '#930a0a';
    const omegaGrayBg = '#F5F5F5';

    // Lấy token và tên tài khoản thực tế từ localStorage giống hệt CategoryManager
    const token = localStorage.getItem('accessToken');
    const currentUsername = localStorage.getItem('username') || 'Admin';

    const [formData, setFormData] = useState({ foodName: '', price: '', description: '', imageUrl: '', categoryId: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch('https://honviet-ryt3.onrender.com/api/foods').then(res => res.json()),
            fetch('https://honviet-ryt3.onrender.com/api/categories').then(res => res.json())
        ])
            .then(([foodsData, categoriesData]) => {
                setFoods(foodsData);
                setCategories(categoriesData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Lỗi tải dữ liệu ban đầu:", err);
                setLoading(false);
            });
    }, []);

    const getFoods = () => {
        fetch('https://honviet-ryt3.onrender.com/api/foods')
            .then(res => res.json())
            .then(data => setFoods(data))
            .catch(err => console.error("Lỗi lấy danh sách món ăn:", err));
    };

    // XỬ LÝ ĐĂNG XUẤT HỆ THỐNG ĐỒNG BỘ
    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        toast({
            title: "Đã đăng xuất",
            description: "Đăng xuất thành công",
            status: "info",
            duration: 2000,
            position: "top"
        });
        navigate("/login");
    };

    // Hàm kích hoạt trạng thái chỉnh sửa món ăn
    const handleEditClick = (food) => {
        setEditingId(food.foodId);
        setFormData({
            foodName: food.foodName,
            price: food.price,
            description: food.description || '',
            imageUrl: food.imageUrl || '',
            categoryId: food.category ? food.category.categoryId : ''
        });
        setPreviewUrl(formatImageUrl(food.imageUrl));
        setSelectedFile(null);
    };

    // Hàm bổ trợ thông minh: Tự động chuẩn hóa đường dẫn ảnh từ Backend gửi về
    const formatImageUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/150';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
            return url;
        }
        return `https://honviet-ryt3.onrender.com${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ foodName: '', price: '', description: '', imageUrl: '', categoryId: '' });
        setSelectedFile(null);
        setPreviewUrl('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            let finalImageUrl = formData.imageUrl;

            if (selectedFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedFile);

                const uploadRes = await fetch('https://honviet-ryt3.onrender.com/api/foods/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadFormData
                });

                if (!uploadRes.ok) throw new Error("Tải hình ảnh lên máy chủ thất bại!");
                const uploadData = await uploadRes.json();
                finalImageUrl = uploadData.imageUrl;
            }

            const foodPayload = {
                foodName: formData.foodName,
                price: Number(formData.price),
                description: formData.description,
                imageUrl: finalImageUrl,
                category: formData.categoryId ? { categoryId: Number(formData.categoryId) } : null
            };

            const url = editingId ? `https://honviet-ryt3.onrender.com/api/foods/${editingId}` : 'https://honviet-ryt3.onrender.com/api/foods';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(foodPayload)
            });

            if (res.status === 403) {
                toast({ title: "Lỗi phân quyền", description: "Tài khoản của bạn không có quyền ADMIN!", status: "error", position: "top" });
                return;
            }

            if (!res.ok) throw new Error("Không thể lưu thông tin món ăn vào cơ sở dữ liệu!");

            toast({
                title: "Thành công",
                description: editingId ? "Cập nhật món ăn thành công!" : "Thêm món ăn mới thành công!",
                status: "success",
                position: "top",
                duration: 2000
            });

            handleCancelEdit();
            getFoods();

        } catch (error) {
            toast({ title: "Lỗi hệ thống", description: error.message, status: "error", position: "top" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Món ăn này sẽ bị xóa khỏi hệ thống thực đơn Hồn Việt?")) {
            fetch(`https://honviet-ryt3.onrender.com/api/foods/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => {
                    if (res.status === 403) {
                        toast({ title: "Thất bại", description: "Bạn không có quyền Admin!", status: "error", position: "top" });
                        return;
                    }
                    toast({ title: "Đã xóa", description: "Đã xóa món ăn khỏi thực đơn!", status: "info", position: "top" });
                    getFoods();
                });
        }
    };

    if (loading) {
        return (
            <Center p="100px" flexDir="column" minH="100vh">
                <Spinner color={omegaGreen} size="lg" thickness="4px" speed="0.8s" mb={4} />
                <Text fontSize="13px" fontWeight="bold" color="gray.600" letterSpacing="0.5px">ĐANG ĐỒNG BỘ THỰC ĐƠN HỒN VIỆT...</Text>
            </Center>
        );
    }

    return (
        <Box bg="white" minH="100vh">
            <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;900&family=Oswald:wght@500;700&family=Quicksand:wght@700&display=swap" rel="stylesheet" />

            {/* ===================== ĐỒNG BỘ PHẦN ĐẦU (HEADER) TRANG ADMIN ===================== */}
            <Box bg={omegaGreen} color="white" py="10px" textAlign="center" fontSize="13px" fontWeight="bold" letterSpacing="1.5px">
                HỒN VIỆT — MỸ VỊ CHÍNH THỐNG ĐẬM ĐÀ QUÊ HƯƠNG (DASHBOARD)
            </Box>

            <Box bg="white" borderBottom="1px solid #EDEDED" py="12px" px={{ base: '15px', md: '30px' }} position="sticky" top="0" zIndex="10">
                <Flex maxW="1600px" mx="auto" align="center" justify="space-between">
                    <HStack spacing="12px" cursor="pointer" onClick={() => navigate("/client/food-menu")}>
                        <Image src={logoLotus} alt="Hon Viet Logo" boxSize="50px" objectFit="contain" />
                        <Box display={{ base: 'none', sm: 'block' }}>
                            <Text fontSize="18px" fontFamily='"Comfortaa", "Quicksand", "Segoe UI", sans-serif' fontWeight="900" color={omegaGreen} letterSpacing="0.5px" lineHeight="none">
                                HỒN VIỆT
                            </Text>
                            <Text fontSize="9px" color="gray.500" fontWeight="bold" letterSpacing="0.5px" mt="2px">
                                SINCE 2026
                            </Text>
                        </Box>
                    </HStack>

                    {/* Menu Chuyển nhanh giữa các trang quản trị của Admin */}
                    <HStack spacing="15px" fontSize="12px" fontWeight="800">
                        <Text cursor="pointer" color={omegaGreen} borderBottom={`2px solid ${omegaGreen}`} pb="2px">MÓN ĂN</Text>
                        <Text cursor="pointer" color="gray.500" _hover={{ color: omegaGreen }} onClick={() => navigate("/admin/categories")}>DANH MỤC</Text>
                        <Text cursor="pointer" color="gray.500" _hover={{ color: omegaGreen }} onClick={() => navigate("/admin/orders")}>ĐƠN HÀNG</Text>
                        <Text cursor="pointer" color="gray.500" _hover={{ color: omegaGreen }} onClick={() => navigate("/admin/users")}>THÀNH VIÊN</Text>
                    </HStack>

                    {/* ĐỒNG BỘ HIỂN THỊ TÀI KHOẢN GIỐNG TRANG DANH MỤC */}
                    <HStack spacing="15px">
                        <Menu isLazy placement="bottom-end">
                            <MenuButton cursor="pointer" _hover={{ opacity: 0.85 }}>
                                <HStack spacing="10px">
                                    <Text fontSize="12px" fontWeight="800" color="gray.700" display={{ base: 'none', md: 'block' }}>
                                        {currentUsername}
                                    </Text>
                                    <Avatar
                                        name={currentUsername}
                                        size="sm"
                                        bg={omegaGreen}
                                        color="white"
                                        fontWeight="bold"
                                    />
                                </HStack>
                            </MenuButton>

                            <MenuList borderRadius="0px" border="1px solid #EAEAEA" boxShadow="xl" py="0px">
                                <Box px="15px" py="12px" bg="gray.50">
                                    <Text fontSize="10px" fontWeight="bold" color="gray.400" letterSpacing="0.5px">ĐANG ĐĂNG NHẬP</Text>
                                    <Text fontSize="13px" fontWeight="800" color="#222" mt="2px">{currentUsername}</Text>
                                </Box>
                                <MenuDivider m="0" borderColor="#EAEAEA" />
                                <MenuDivider m="0" borderColor="#EAEAEA" />
                                <MenuItem fontSize="12px" fontWeight="800" color="red.600" py="10px" _hover={{ bg: 'red.50' }} onClick={handleLogout}>
                                    ĐĂNG XUẤT
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    </HStack>
                </Flex>
            </Box>

            {/* BREADCRUMB ĐỊNH VỊ TRANG */}
            <Box bg={omegaGrayBg} py="10px" px={{ base: '15px', md: '30px' }}>
                <HStack maxW="1600px" mx="auto" fontSize="12px" color="gray.500" fontWeight="600">
                    <Text cursor="pointer" onClick={() => navigate("/client/food-menu")}>Trang chủ</Text>
                    <Text>/</Text>
                    <Text color="gray.800">Quản trị hệ thống thực đơn</Text>
                </HStack>
            </Box>

            {/* ===================== KHỐI NỘI DUNG CHÍNH (HAI CỘT PHẲNG LÌ) ===================== */}
            <Flex direction={{ base: 'column', xl: 'row' }} gap="30px" align="flex-start" p={{ base: '20px 15px', md: '40px 30px' }} maxW="1600px" mx="auto">

                {/* KHU VỰC CỘT TRÁI: FORM NHẬP LIỆU */}
                <Box flex={1} bg="white" border="1px solid #EAEAEA" p="24px" w="100%" borderRadius="0px" boxShadow="none">
                    <HStack justify="space-between" mb="20px" pb="10px" borderBottom="2px solid #EAEAEA">
                        <Text fontSize="13px" fontWeight="800" color="#222" textTransform="uppercase" letterSpacing="0.5px">
                            {editingId ? "CẬP NHẬT THÔNG TIN MÓN ĂN" : "THÊM MÓN MỚI"}
                        </Text>
                        {editingId && (
                            <Button size="xs" colorScheme="gray" variant="solid" leftIcon={<MdClose />} borderRadius="0px" onClick={handleCancelEdit}>
                                Hủy sửa
                            </Button>
                        )}
                    </HStack>

                    <form onSubmit={handleSubmit}>
                        <VStack spacing="15px" align="stretch">
                            <Box>
                                <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase">Tên món ăn *</Text>
                                <Input variant="outline" borderRadius="0px" boxShadow="none" focusBorderColor={omegaGreen} h="40px" fontSize="13px" placeholder="Ví dụ: Cơm Tấm Sườn Bì Chả..." required value={formData.foodName} onChange={e => setFormData({...formData, foodName: e.target.value})} />
                            </Box>

                            <Box>
                                <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase">Danh mục món *</Text>
                                <Select placeholder="-- Chọn Danh Mục --" borderRadius="0px" boxShadow="none" focusBorderColor={omegaGreen} h="40px" fontSize="13px" required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name || c.categoryName}</option>)}
                                </Select>
                            </Box>

                            <Box>
                                <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase">Giá bán lẻ (VNĐ) *</Text>
                                <Input variant="outline" borderRadius="0px" boxShadow="none" focusBorderColor={omegaGreen} type="number" h="40px" fontSize="13px" placeholder="Ví dụ: 45000" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                            </Box>

                            <Box>
                                <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase">Mô tả món ăn</Text>
                                <Textarea placeholder="Nguyên liệu chính, hương vị đặc trưng..." borderRadius="0px" boxShadow="none" focusBorderColor={omegaGreen} fontSize="13px" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} h="100px" />
                            </Box>

                            <Box>
                                <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase">HÌNH MÓN ĂN</Text>
                                <Input type="file" accept="image/*" onChange={handleFileChange} display="none" id="food-img-upload" />
                                <Button as="label" htmlFor="food-img-upload" variant="outline" borderRadius="0px" border="1px dashed #CCC" h="45px" w="100%" cursor="pointer" _hover={{ bg: "gray.50" }} leftIcon={<MdCloudUpload />}>
                                    TẢI FILE ẢNH LÊN
                                </Button>
                                {previewUrl && (
                                    <Center mt="15px" border="1px solid #EAEAEA" p="10px">
                                        <Image src={previewUrl} alt="Preview" maxH="150px" objectFit="contain" />
                                    </Center>
                                )}
                            </Box>

                            <Button type="submit" bg={omegaGreen} color="white" _hover={{ bg: "#750808" }} size="lg" fontSize="12px" fontWeight="800" borderRadius="0px" h="45px" w="100%" isLoading={isUploading}>
                                {editingId ? "XÁC NHẬN CẬP NHẬT MÓN ĂN" : "XÁC NHẬN ĐĂNG MÓN ĂN MỚI"}
                            </Button>
                        </VStack>
                    </form>
                </Box>

                {/* KHU VỰC CỘT PHẢI: BẢNG HIỂN THỊ */}
                <Box flex={2} bg="white" border="1px solid #EAEAEA" p="24px" w="100%" borderRadius="0px">
                    <Text fontSize="13px" fontWeight="800" color="#222" textTransform="uppercase" letterSpacing="0.5px" mb="20px" pb="10px" borderBottom="2px solid #EAEAEA">
                        THỰC ĐƠN HỆ THỐNG ({foods.length} MÓN ĂN)
                    </Text>

                    <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead bg={omegaGrayBg}>
                                <Tr>
                                    <Th py="12px" borderColor="#EAEAEA" fontSize="11px" color="#222" fontWeight="800">HÌNH ẢNH MÓN ĂN</Th>
                                    <Th py="12px" borderColor="#EAEAEA" fontSize="11px" color="#222" fontWeight="800">TÊN MÓN ĂN</Th>
                                    <Th py="12px" borderColor="#EAEAEA" fontSize="11px" color="#222" fontWeight="800">DANH MỤC</Th>
                                    <Th py="12px" borderColor="#EAEAEA" fontSize="11px" color="#222" fontWeight="800">GIÁ BÁN</Th>
                                    <Th py="12px" borderColor="#EAEAEA" fontSize="11px" color="#222" fontWeight="800" textAlign="center">THAO TÁC</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {foods.length === 0 ? (
                                    <Tr>
                                        <Td colSpan="5" textAlign="center" py="40px" fontSize="12px" fontWeight="bold" color="gray.400">
                                            Chưa có món ăn nào trong thực đơn hệ thống.
                                        </Td>
                                    </Tr>
                                ) : (
                                    foods.map((food) => (
                                        <Tr key={food.foodId} _hover={{ bg: "gray.50" }} borderBottom="1px solid #EAEAEA">
                                            <Td py="10px" borderColor="#EAEAEA">
                                                <Image src={formatImageUrl(food.imageUrl)} alt={food.foodName} boxSize="45px" objectFit="cover" border="1px solid #EAEAEA" />
                                            </Td>
                                            <Td py="14px" borderColor="#EAEAEA" fontSize="12px" fontWeight="800" color="#222" textTransform="uppercase">
                                                {food.foodName}
                                            </Td>
                                            <Td py="14px" borderColor="#EAEAEA" fontSize="12px" color="gray.500" fontWeight="600">
                                                {food.category ? (food.category.name || food.category.categoryName) : 'Không phân loại'}
                                            </Td>
                                            <Td py="14px" borderColor="#EAEAEA" fontSize="12px" fontWeight="800" color={omegaGreen}>
                                                {food.price ? food.price.toLocaleString('vi-VN') : '0'}đ
                                            </Td>
                                            <Td py="14px" borderColor="#EAEAEA">
                                                <Flex justify="center" gap="5px">
                                                    <IconButton size="sm" variant="ghost" colorScheme="blue" borderRadius="0px" icon={<MdEdit size="16px" />} onClick={() => handleEditClick(food)} />
                                                    <IconButton size="sm" variant="ghost" colorScheme="red" borderRadius="0px" icon={<MdDelete size="16px" />} onClick={() => handleDelete(food.foodId)} />
                                                </Flex>
                                            </Td>
                                        </Tr>
                                    ))
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                </Box>
            </Flex>

            {/* FOOTER */}
            <Box bg="white" borderTop="1px solid #EAEAEA" py="20px" textAlign="center" fontSize="11px" color="gray.400" fontWeight="bold">
                Copyright © 2026 honvietfoods. Powered by Yuri Project (Hệ thống quản trị nội bộ)
            </Box>
        </Box>
    );
}