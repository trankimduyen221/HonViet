/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiShoppingCart } from 'react-icons/fi';
import {
    Box,
    Flex,
    Text,
    SimpleGrid,
    Button,
    Image,
    Badge,
    Spinner,
    useToast,
    HStack,
    Center,
    Input,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Avatar,
    MenuDivider,
    InputGroup,
    InputRightElement
} from '@chakra-ui/react';
import axios from 'axios';

// Import các tài nguyên hình ảnh từ thư mục assets
import logoLotus from '../../assets/logo.jpg';
import bannerMenu from '../../assets/Running-Photos/mae-mu-H5Hj8QV2Tx4-unsplash.jpg';

export default function FoodMenu() {
    const [foods, setFoods] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();
    const toast = useToast();

    const token = localStorage.getItem('accessToken');
    const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username'));
    const [currentAvatar, setCurrentAvatar] = useState(localStorage.getItem('avatar') || '');
    const userRole = localStorage.getItem('role') || '';

    useEffect(() => {
        const handleStorageChange = () => {
            setCurrentUsername(localStorage.getItem('username'));
            setCurrentAvatar(localStorage.getItem('avatar') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // 🔴 BỔ SUNG PHÂN QUYỀN: Tự động điều hướng Admin hoặc Shipper sang trang chuyên biệt
    useEffect(() => {
        if (!token) return;

        const role = userRole.toUpperCase();
        if (role === 'ADMIN') {
            navigate('/admin/foods');
        } else if (role === 'SHIPPER') {
            navigate('/shipper/orders');
        }
    }, [token, userRole, navigate]);

    const omegaGreen = '#930a0a';
    const omegaDarkGreen = '#610404';
    const omegaGrayBg = '#F8F9FA';

    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('honVietCart')) || [];
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(total);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [foodRes, catRes] = await Promise.all([
                    axios.get('https://honviet-ryt3.onrender.com/api/foods'),
                    axios.get('https://honviet-ryt3.onrender.com/api/categories')
                ]);
                setFoods(foodRes.data);
                setCategories(catRes.data);
                updateCartCount();
                setLoading(false);
            } catch (err) {
                console.error('Lỗi tải dữ liệu thực đơn:', err);
                toast({
                    title: 'Lỗi kết nối',
                    description: 'Không thể đồng bộ danh sách thực đơn từ hệ thống!',
                    status: 'error',
                    position: 'top',
                    duration: 3000,
                    isClosable: true,
                });
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        localStorage.removeItem('avatar');
        localStorage.removeItem('role');
        toast({
            title: "Đã đăng xuất",
            description: "Hệ thống đã xóa phiên làm việc an toàn.",
            status: "info",
            duration: 2000,
            position: "top"
        });
        navigate("/client/auth");
    };

    const addToCart = (food) => {
        // Chặn lần 2 trong hàm xử lý nếu tài khoản là SHIPPER
        if (userRole.toUpperCase() === 'SHIPPER') {
            toast({
                title: 'Không thể thực hiện',
                description: 'Tài khoản Shipper không có quyền đặt mua hàng!',
                status: 'warning',
                duration: 2000,
                position: 'top'
            });
            return;
        }

        let cart = JSON.parse(localStorage.getItem('honVietCart')) || [];
        const existingItem = cart.find(item => item.foodId === food.foodId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                foodId: food.foodId,
                foodName: food.foodName,
                price: food.price,
                imageUrl: food.imageUrl,
                quantity: 1
            });
        }

        localStorage.setItem('honVietCart', JSON.stringify(cart));
        updateCartCount();

        toast({
            title: 'Đã thêm vào giỏ! 🛒',
            description: `Thêm thành công món ${food.foodName} vào giỏ hàng.`,
            status: 'success',
            duration: 1500,
            isClosable: true,
            position: 'top'
        });
    };

    // Bộ lọc Category + Tìm kiếm
    const filteredFoods = foods.filter(food => {
        const matchesCategory = selectedCategory === 'All' || food.category?.categoryId === parseInt(selectedCategory);
        const matchesSearch = food.foodName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return (
            <Center minH="50vh" flexDirection="column" gap={3}>
                <Spinner size="xl" color={omegaGreen} thickness="4px" />
                <Text fontWeight="semibold" color="gray.600">Đang tải thực đơn Hồn Việt...</Text>
            </Center>
        );
    }

    return (
        <Box bg="#FAFAFA" minH="100vh" pb="0px">
            <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;900&family=Oswald:wght@500;700&family=Quicksand:wght@600;700;900&display=swap" rel="stylesheet" />

            <Box bg={omegaGreen} color="white" py="10px" textAlign="center" fontSize="13px" fontWeight="bold" letterSpacing="1.5px">
                HỒN VIỆT — MỸ VỊ CHÍNH THỐNG ĐẬM ĐÀ QUÊ HƯƠNG
            </Box>

            {/* STICKY HEADER NAVBAR */}
            <Box bg="white" borderBottom="1px solid #EDEDED" py="12px" px={{ base: '15px', md: '30px' }} position="sticky" top="0" zIndex="10" boxShadow="sm">
                <Flex maxW="1400px" mx="auto" align="center" justify="space-between">
                    <HStack spacing="12px" cursor="pointer" onClick={() => navigate('/')}>
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

                    <HStack spacing="24px" display={{ base: 'none', lg: 'flex' }} fontSize="13px" fontWeight="700" color="#333333" letterSpacing="0.5px">
                        <Text _hover={{ color: omegaGreen }} cursor="pointer" onClick={() => navigate('/')}>TRANG CHỦ</Text>
                        <Text color={omegaGreen} cursor="pointer" borderBottom={`2px solid ${omegaGreen}`} pb="4px" onClick={() => { setSelectedCategory('All'); setSearchTerm(''); }}>THỰC ĐƠN</Text>
                        <Text _hover={{ color: omegaGreen }} cursor="pointer" onClick={() => navigate('/', { state: { scrollTo: 'intro' } })}>GIỚI THIỆU</Text>
                        <Text _hover={{ color: omegaGreen }} cursor="pointer" onClick={() => navigate('/', { state: { scrollTo: 'footer' } })}>LIÊN HỆ</Text>
                    </HStack>

                    <HStack spacing="25px">
                        <HStack spacing="8px" display={{ base: 'none', md: 'flex' }} cursor="pointer" onClick={() => navigate('/', { state: { scrollTo: 'footer' } })}>
                            <Text fontSize="20px">📞</Text>
                            <Box>
                                <Text fontSize="11px" color="gray.500" fontWeight="600" mb="-3px">Liên hệ đặt món</Text>
                                <Text fontSize="15px" fontWeight="800" color={omegaGreen}>1900 55 88 50</Text>
                            </Box>
                        </HStack>

                        <HStack spacing="12px">
                            {/* DROPDOWN MENU TÀI KHOẢN */}
                            <Menu isLazy placement="bottom-end">
                                <MenuButton style={{ outline: 'none', border: 'none' }}>
                                    {token && currentUsername ? (
                                        <Avatar
                                            name={currentUsername}
                                            src={currentAvatar}
                                            size="sm"
                                            bg={omegaGreen}
                                            color="white"
                                            fontWeight="bold"
                                            cursor="pointer"
                                            boxSize="45px"
                                            objectFit="cover"
                                            _hover={{ opacity: 0.85 }}
                                        />
                                    ) : (
                                        <IconButton
                                            icon={<FiUser size="20px" />}
                                            aria-label="Account"
                                            variant="solid"
                                            bg="#EFEFEF"
                                            color="#333"
                                            borderRadius="full"
                                            boxSize="45px"
                                            _hover={{ bg: '#E2E2E2', color: omegaGreen }}
                                        />
                                    )}
                                </MenuButton>

                                <MenuList minW="185px" borderRadius="12px" border="1px solid #EAEAEA" boxShadow="0 10px 30px rgba(0, 0, 0, 0.08)" py="4px" overflow="hidden">
                                    {token && currentUsername ? (
                                        <>
                                            <Box px="14px" py="8px" bg="gray.50">
                                                <Text fontSize="10px" fontWeight="700" color="gray.400" letterSpacing="0.8px">ĐANG ĐĂNG NHẬP</Text>
                                                <Text fontSize="13px" fontWeight="800" color="gray.800" mt="1px">{currentUsername}</Text>
                                                <Badge colorScheme={userRole.toUpperCase() === 'ADMIN' ? 'red' : userRole.toUpperCase() === 'SHIPPER' ? 'blue' : 'green'} mt="4px" fontSize="9px" px="5px" borderRadius="4px">
                                                    {userRole.toUpperCase()}
                                                </Badge>
                                            </Box>
                                            <MenuDivider borderColor="#EAEAEA" my="4px" />
                                            {userRole.toUpperCase() === 'ADMIN' && (
                                                <MenuItem fontSize="13px" fontWeight="700" color={omegaGreen} py="8px" px="14px" _hover={{ bg: 'red.50' }} onClick={() => navigate("/admin/foods")}>
                                                    Trang quản trị (Admin)
                                                </MenuItem>
                                            )}
                                            {/* 🔴 BỔ SUNG: Nút truy cập cho Shipper */}
                                            {userRole.toUpperCase() === 'SHIPPER' && (
                                                <MenuItem fontSize="13px" fontWeight="700" color="blue.600" py="8px" px="14px" _hover={{ bg: 'blue.50' }} onClick={() => navigate("/shipper/orders")}>
                                                    🚚 Trang giao hàng (Shipper)
                                                </MenuItem>
                                            )}
                                            <MenuItem fontSize="13px" fontWeight="600" color="gray.700" py="8px" px="14px" _hover={{ bg: 'gray.50', color: omegaGreen }} onClick={() => navigate("/client/profile")} >
                                                ⚙️ Thông tin cá nhân
                                            </MenuItem>
                                            <MenuItem fontSize="13px" fontWeight="600" color="gray.700" py="8px" px="14px" _hover={{ bg: 'gray.50', color: omegaGreen }} onClick={() => navigate("/client/orders")}>
                                                Đơn hàng của tôi
                                            </MenuItem>
                                            <MenuDivider borderColor="#EAEAEA" my="4px" />
                                            <MenuItem fontSize="13px" fontWeight="700" color="red.600" py="8px" px="14px" _hover={{ bg: 'red.50' }} onClick={handleLogout}>
                                                Đăng xuất
                                            </MenuItem>
                                        </>
                                    ) : (
                                        <>
                                            <MenuItem fontSize="13px" fontWeight="600" color="gray.700" py="8px" px="14px" _hover={{ bg: 'gray.50', color: omegaGreen }} onClick={() => navigate("/client/auth")}>Đăng nhập</MenuItem>
                                            <MenuItem fontSize="13px" fontWeight="600" color="gray.700" py="8px" px="14px" _hover={{ bg: 'gray.50', color: omegaGreen }} onClick={() => navigate("/client/auth")}>Đăng ký tài khoản</MenuItem>
                                        </>
                                    )}
                                </MenuList>
                            </Menu>

                            {/* 🔴 BỔ SUNG: Ẩn Giỏ hàng đối với tài khoản Shipper */}
                            {userRole.toUpperCase() !== 'SHIPPER' && (
                                <Box position="relative">
                                    <IconButton icon={<FiShoppingCart size="20px" />} aria-label="Cart" variant="solid" bg="#EFEFEF" color="#333" borderRadius="full" boxSize="45px" _hover={{ bg: '#E2E2E2', color: omegaGreen }} onClick={() => navigate("/client/cart")} />
                                    {cartCount > 0 && (
                                        <Box position="absolute" top="-2px" right="-2px" bg="#114217" color="white" borderRadius="full" minW="18px" h="18px" display="flex" alignItems="center" justifyContent="center" fontSize="11px" fontWeight="bold" px="4px" zIndex="3">
                                            {cartCount}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </HStack>
                    </HStack>
                </Flex>
            </Box>

            {/* BREADCRUMB */}
            <Box bg={omegaGrayBg} py="10px" px={{ base: '15px', md: '30px' }} borderBottom="1px solid #EAEAEA">
                <HStack maxW="1400px" mx="auto" fontSize="12px" color="gray.500" fontWeight="600">
                    <Text cursor="pointer" _hover={{ color: omegaGreen }} onClick={() => navigate('/')}>Trang chủ</Text>
                    <Text>/</Text>
                    <Text color="gray.800">Thực đơn tinh hoa</Text>
                </HStack>
            </Box>

            {/* HERO BANNER TĨNH */}
            <Box position="relative" h="240px" overflow="hidden" backgroundImage={`url(${bannerMenu})`} backgroundSize="cover" backgroundPosition="center 35%">
                <Box position="absolute" top="0" left="0" w="100%" h="100%" bg="blackAlpha.600" zIndex="1" />

                <Flex position="relative" zIndex="2" h="100%" direction="column" align="center" justify="center" px="15px" textAlign="center">
                    <Text fontSize={{ base: '22px', md: '32px' }} fontFamily="'Comfortaa', sans-serif" fontWeight="900" color="white" letterSpacing="1px">
                        THỰC ĐƠN HỒN VIỆT
                    </Text>
                    <Text fontSize={{ base: '12px', md: '14px' }} color="gray.200" fontWeight="600" maxW="500px" mt="6px" fontFamily="'Quicksand', sans-serif">
                        Khám phá trọn vẹn hương vị truyền thống chuẩn vị quê hương được chắt lọc qua từng nguyên liệu tươi ngon sạch lành.
                    </Text>

                    {/* Ô TÌM KIẾM NHANH */}
                    <InputGroup maxW="450px" mt="20px" size="md" boxShadow="lg">
                        <Input
                            placeholder="Tìm kiếm món ăn bạn yêu thích..."
                            bg="white"
                            color="gray.800"
                            borderRadius="full"
                            fontSize="13px"
                            fontWeight="600"
                            h="42px"
                            focusBorderColor={omegaGreen}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <InputRightElement h="42px" pr="6px">
                            <FiSearch size="16px" color="#777" />
                        </InputRightElement>
                    </InputGroup>
                </Flex>
            </Box>

            {/* DANH SÁCH MÓN ĂN CHÍNH */}
            <Box p={{ base: '15px', md: '35px' }} maxW="1400px" mx="auto">

                {/* LỌC DANH MỤC */}
                <HStack spacing="0" mb="40px" justify="center" wrap="wrap" borderBottom="1px solid #EAEAEA" pb="0px">
                    <Button variant="unstyled" h="45px" px="25px" color={selectedCategory === 'All' ? omegaGreen : 'gray.500'} borderBottom={selectedCategory === 'All' ? `3px solid ${omegaGreen}` : 'none'} borderRadius="0" fontWeight="800" fontSize="13px" letterSpacing="0.5px" onClick={() => setSelectedCategory('All')}>
                        🍽️ TẤT CẢ MÓN
                    </Button>
                    {categories.map((cat) => {
                        const catIdStr = cat.categoryId.toString();
                        const isSelected = selectedCategory === catIdStr;
                        return (
                            <Button key={cat.categoryId} variant="unstyled" h="45px" px="25px" color={isSelected ? omegaGreen : 'gray.500'} borderBottom={isSelected ? `3px solid ${omegaGreen}` : 'none'} borderRadius="0" fontWeight="800" fontSize="13px" letterSpacing="0.5px" onClick={() => setSelectedCategory(catIdStr)}>
                                {cat.name || cat.categoryName || ''}
                            </Button>
                        );
                    })}
                </HStack>

                {/* GRID MÓN ĂN */}
                {filteredFoods.length === 0 ? (
                    <Box textAlign="center" py="60px">
                        <Text color="gray.400" fontSize="md" fontWeight="bold">Không tìm thấy món ăn phù hợp với tiêu chí lọc.</Text>
                    </Box>
                ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="25px">
                        {filteredFoods.map((food) => (
                            <Box
                                key={food.foodId}
                                bg="white"
                                border="1px solid #EFEFEF"
                                borderRadius="8px"
                                overflow="hidden"
                                transition="all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"
                                _hover={{
                                    transform: 'translateY(-6px)',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
                                    borderColor: 'gray.200'
                                }}
                                display="flex"
                                flexDirection="column"
                            >
                                <Flex direction="column" h="100%" justify="space-between">
                                    <Box overflow="hidden" position="relative">
                                        <Image src={food.imageUrl || 'https://via.placeholder.com/300x200?text=Hon+Viet+Food'} alt={food.foodName} w="100%" h="210px" objectFit="cover" transition="transform 0.5s" _hover={{ transform: 'scale(1.06)' }} />
                                        <Badge position="absolute" top="10px" left="10px" bg={omegaGreen} color="white" borderRadius="4px" px="8px" py="3px" fontSize="9px" fontWeight="bold" fontFamily='"Quicksand", sans-serif' letterSpacing="0.5px">
                                            {food.category?.name || food.category?.categoryName || 'MÓN ĂN'}
                                        </Badge>
                                    </Box>

                                    <Box p="16px" flex="1" display="flex" flexDirection="column" justify="space-between">
                                        <Box mb="12px">
                                            <Text color="#222222" fontSize="14px" fontFamily='"Comfortaa", "Quicksand", sans-serif' fontWeight="900" noOfLines={1} textTransform="uppercase" letterSpacing="0.2px">
                                                {food.foodName}
                                            </Text>
                                            <Text color="gray.500" fontSize="12px" fontFamily='"Quicksand", sans-serif' mt="6px" noOfLines={2} lineHeight="1.5" fontWeight="600">
                                                {food.description || 'Hương vị truyền thống thơm ngon đậm đà, đảm bảo vệ sinh an toàn thực phẩm.'}
                                            </Text>
                                        </Box>

                                        <Flex justify="space-between" align="center" pt="12px" borderTop="1px solid #F8F9FA">
                                            <Text color="#A81D1D" fontSize="16px" fontWeight="900" fontFamily='"Quicksand", sans-serif'>
                                                {food.price ? food.price.toLocaleString('vi-VN') : 0}đ
                                            </Text>

                                            {/* 🔴 BỔ SUNG: Thay đổi nút mua nếu là vai trò SHIPPER */}
                                            {userRole.toUpperCase() === 'SHIPPER' ? (
                                                <Badge colorScheme="blue" px="10px" py="4px" borderRadius="full" fontSize="10px">
                                                    Chỉ xem (Shipper)
                                                </Badge>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    bg={omegaGreen}
                                                    color="white"
                                                    _hover={{ bg: omegaDarkGreen }}
                                                    borderRadius="full"
                                                    px="16px"
                                                    fontSize="11px"
                                                    fontWeight="800"
                                                    fontFamily='"Quicksand", sans-serif'
                                                    onClick={() => addToCart(food)}
                                                >
                                                    MUA NGAY
                                                </Button>
                                            )}
                                        </Flex>
                                    </Box>
                                </Flex>
                            </Box>
                        ))}
                    </SimpleGrid>
                )}
            </Box>

            {/* FOOTER */}
            <Box bg="white" borderTop="1px solid #EAEAEA" mt="60px" py="20px">
                <Text
                    textAlign="center"
                    fontSize="11px"
                    color="gray.400"
                    fontWeight="bold"
                    letterSpacing="0.5px"
                >
                    Copyright © 2026 honvietfoods. Powered by Yuri Project
                </Text>
            </Box>
        </Box>
    );
}