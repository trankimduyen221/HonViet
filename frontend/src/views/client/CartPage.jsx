/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiShoppingCart } from 'react-icons/fi';
import { MdDelete, MdShoppingBag } from 'react-icons/md';
import {
    Box,
    Flex,
    Text,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    Button,
    Input,
    VStack,
    HStack,
    Image,
    useToast,
    Icon,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    Avatar,
    Badge
} from '@chakra-ui/react';
import axios from 'axios';

import logoLotus from '../../assets/logo.jpg';

export default function CartPage() {
    const [cart, setCart] = useState([]);
    const [shippingAddress, setShippingAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();
    const toast = useToast();

    // Link ảnh mặc định chống vỡ ảnh khi tải món trong giỏ
    const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=800';

    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username') || sessionStorage.getItem('username') || '');
    const [currentAvatar, setCurrentAvatar] = useState(localStorage.getItem('avatar') || sessionStorage.getItem('avatar') || '');
    const userRole = localStorage.getItem('role') || sessionStorage.getItem('role') || '';

    const omegaGreen = '#930a0a';
    const omegaGrayBg = '#F8F9FA';
    const bodyFont = '"Quicksand", sans-serif';

    // Hàm chuẩn hóa đường dẫn ảnh từ Backend gửi về
    const formatImageUrl = (url) => {
        if (!url || typeof url !== 'string' || url.trim() === '') return DEFAULT_FOOD_IMAGE;

        // Nếu đã là URL hoàn chỉnh (Cloudinary, HTTPS, HTTP, Blob, Base64) -> Giữ nguyên
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
            return url;
        }

        // Fallback phòng trường hợp còn dữ liệu đĩa local cũ trong DB
        return `https://honviet-ryt3.onrender.com${url.startsWith('/') ? '' : '/'}${url}`;
    };

    useEffect(() => {
        const handleStorageChange = () => {
            setCurrentUsername(localStorage.getItem('username') || sessionStorage.getItem('username') || '');
            setCurrentAvatar(localStorage.getItem('avatar') || sessionStorage.getItem('avatar') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateCartCount = (currentCart) => {
        const total = currentCart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(total);
    };

    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem('honVietCart')) || [];
        setCart(savedCart);
        updateCartCount(savedCart);
    }, []);

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const updateQuantity = (foodId, newQty) => {
        if (newQty < 1) return;
        const updatedCart = cart.map(item =>
            item.foodId === foodId ? { ...item, quantity: newQty } : item
        );
        setCart(updatedCart);
        localStorage.setItem('honVietCart', JSON.stringify(updatedCart));
        updateCartCount(updatedCart);
    };

    const removeFromCart = (foodId) => {
        const updatedCart = cart.filter(item => item.foodId !== foodId);
        setCart(updatedCart);
        localStorage.setItem('honVietCart', JSON.stringify(updatedCart));
        updateCartCount(updatedCart);
        toast({
            title: "Đã xóa món ăn khỏi giỏ",
            status: "info",
            position: "top",
            duration: 1500
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        localStorage.removeItem('avatar');
        localStorage.removeItem('role');
        sessionStorage.clear();
        toast({
            title: "Đã đăng xuất",
            description: "Hệ thống đã xóa phiên làm việc an toàn.",
            status: "info",
            duration: 2000,
            position: "top"
        });
        navigate("/client/auth");
    };

    const handleCheckout = async (e) => {
        e.preventDefault();

        if (!token) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập tài khoản trước khi thực hiện đặt món!",
                status: "warning",
                position: "top",
                duration: 3000
            });
            navigate("/client/auth");
            return;
        }
        if (cart.length === 0) {
            toast({ title: "Giỏ hàng trống", status: "warning", position: "top", duration: 2000 });
            return;
        }

        setIsSubmitting(true);

        const orderPayload = {
            shippingAddress: shippingAddress,
            phoneNumber: phoneNumber,
            totalPrice: totalPrice,
            status: "Pending",
            orderDetails: cart.map(item => ({
                food: {
                    foodId: item.foodId
                },
                quantity: item.quantity,
                price: item.price
            }))
        };

        try {
            await axios.post('https://honviet-ryt3.onrender.com/api/orders', orderPayload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast({
                title: "Đặt hàng thành công! 🎉",
                description: "Đơn hàng Hồn Việt của bạn đã được gửi tới hệ thống.",
                status: "success",
                position: "top",
                duration: 3000
            });

            setCart([]);
            localStorage.removeItem('honVietCart');
            setCartCount(0);
            setShippingAddress('');
            setPhoneNumber('');

            navigate('/client/orders');
        } catch (error) {
            toast({
                title: "Đặt hàng thất bại",
                description: error.response?.data?.message || "Hệ thống gặp sự cố kết nối, vui lòng thử lại sau!",
                status: "error",
                position: "top",
                duration: 3000
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box bg="#FAFAFA" minH="100vh" pb="0px">
            <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;900&family=Oswald:wght@500;700&family=Quicksand:wght@600;700;900&display=swap" rel="stylesheet" />

            <Box bg={omegaGreen} color="white" py="10px" textAlign="center" fontSize="13px" fontWeight="bold" letterSpacing="1.5px" fontFamily={bodyFont}>
                HỒN VIỆT — MỸ VỊ CHÍNH THỐNG ĐẬM ĐÀ QUÊ HƯƠNG
            </Box>

            <Box bg="white" borderBottom="1px solid #EDEDED" py="12px" px={{ base: '15px', md: '30px' }} position="sticky" top="0" zIndex="10" boxShadow="sm">
                <Flex maxW="1400px" mx="auto" align="center" justify="space-between">
                    <HStack spacing="12px" cursor="pointer" onClick={() => navigate('/')}>
                        <Image src={logoLotus} alt="Hon Viet Logo" boxSize="50px" objectFit="contain" />
                        <Box display={{ base: 'none', sm: 'block' }}>
                            <Text fontSize="18px" fontFamily='"Comfortaa", "Quicksand", "Segoe UI", sans-serif' fontWeight="900" color={omegaGreen} letterSpacing="0.5px" lineHeight="none">
                                HỒN VIỆT
                            </Text>
                            <Text fontSize="9px" color="gray.500" fontWeight="bold" letterSpacing="0.5px" mt="2px" fontFamily={bodyFont}>
                                SINCE 2026
                            </Text>
                        </Box>
                    </HStack>

                    <HStack spacing="24px" display={{ base: 'none', lg: 'flex' }} fontSize="13px" fontWeight="700" color="#333333" letterSpacing="0.5px" fontFamily={bodyFont}>
                        <Text _hover={{ color: omegaGreen }} cursor="pointer" onClick={() => navigate('/')}>TRANG CHỦ</Text>
                        <Text _hover={{ color: omegaGreen }} cursor="pointer" onClick={() => navigate('/client/food-menu')}>THỰC ĐƠN</Text>
                        <Text _hover={{ color: omegaGreen }} cursor="pointer" onClick={() => navigate('/', { state: { scrollTo: 'intro' } })}>GIỚI THIỆU</Text>
                        <Text _hover={{ color: omegaGreen }} cursor="pointer" onClick={() => navigate('/', { state: { scrollTo: 'footer' } })}>LIÊN HỆ</Text>
                    </HStack>

                    <HStack spacing="25px">
                        <HStack spacing="8px" display={{ base: 'none', md: 'flex' }} cursor="pointer" onClick={() => navigate('/', { state: { scrollTo: 'footer' } })}>
                            <Text fontSize="20px">📞</Text>
                            <Box>
                                <Text fontSize="11px" color="gray.500" fontWeight="600" mb="-3px" fontFamily={bodyFont}>Liên hệ đặt món</Text>
                                <Text fontSize="15px" fontWeight="800" color={omegaGreen} fontFamily={bodyFont}>1900 55 88 50</Text>
                            </Box>
                        </HStack>

                        <HStack spacing="12px">
                            <Menu isLazy placement="bottom-end">
                                <MenuButton style={{ outline: 'none', border: 'none' }}>
                                    {token && currentUsername ? (
                                        <Avatar
                                            name={currentUsername}
                                            src={formatImageUrl(currentAvatar)}
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
                                                <Text fontSize="10px" fontWeight="700" color="gray.400" letterSpacing="0.8px" fontFamily={bodyFont}>ĐANG ĐĂNG NHẬP</Text>
                                                <Text fontSize="13px" fontWeight="800" color="gray.800" mt="1px" fontFamily={bodyFont}>{currentUsername}</Text>
                                                <Badge colorScheme={userRole.toUpperCase() === 'ADMIN' ? 'red' : 'green'} mt="4px" fontSize="9px" px="5px" borderRadius="4px">
                                                    {userRole.toUpperCase()}
                                                </Badge>
                                            </Box>
                                            <MenuDivider borderColor="#EAEAEA" my="4px" />
                                            {userRole.toUpperCase() === 'ADMIN' && (
                                                <MenuItem fontSize="13px" fontWeight="700" color={omegaGreen} py="8px" px="14px" _hover={{ bg: 'red.50' }} onClick={() => navigate("/admin/foods")}>
                                                    Trang quản trị (Admin)
                                                </MenuItem>
                                            )}
                                            <MenuItem fontSize="13px" fontWeight="600" color="gray.700" py="8px" px="14px" _hover={{ bg: 'gray.50', color: omegaGreen }} onClick={() => navigate("/client/profile")}>
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

                            <Box position="relative">
                                <IconButton icon={<FiShoppingCart size="20px" />} aria-label="Cart" variant="solid" bg="#EFEFEF" color="#333" borderRadius="full" boxSize="45px" _hover={{ bg: '#E2E2E2', color: omegaGreen }} />
                                {cartCount > 0 && (
                                    <Box position="absolute" top="-2px" right="-2px" bg="#114217" color="white" borderRadius="full" minW="18px" h="18px" display="flex" alignItems="center" justifyContent="center" fontSize="11px" fontWeight="bold" px="4px" zIndex="3">
                                        {cartCount}
                                    </Box>
                                )}
                            </Box>
                        </HStack>
                    </HStack>
                </Flex>
            </Box>

            <Box bg={omegaGrayBg} py="10px" px={{ base: '15px', md: '30px' }} borderBottom="1px solid #EAEAEA">
                <HStack maxW="1400px" mx="auto" fontSize="12px" color="gray.500" fontWeight="600" fontFamily={bodyFont}>
                    <Text cursor="pointer" _hover={{ color: omegaGreen }} onClick={() => navigate('/')}>Trang chủ</Text>
                    <Text>/</Text>
                    <Text color="gray.800">Giỏ hàng của bạn</Text>
                </HStack>
            </Box>

            <Flex direction={{ base: 'column', lg: 'row' }} gap="30px" p={{ base: '15px', md: '30px' }} maxW="1400px" mx="auto" mt="10px">

                <Box flex={1.8} bg="white" border="1px solid #EAEAEA" p="20px" display="flex" flexDirection="column" borderRadius="8px">
                    <HStack mb="20px" pb="10px" borderBottom="2px solid #EAEAEA">
                        <Icon as={MdShoppingBag} w="22px" h="22px" color={omegaGreen} />
                        <Text fontSize="15px" fontWeight="800" color="#222222" textTransform="uppercase" letterSpacing="0.5px" fontFamily={bodyFont}>
                            CHI TIẾT GIỎ HÀNG ({cart.length} món)
                        </Text>
                    </HStack>

                    {cart.length === 0 ? (
                        <Text py="60px" textAlign="center" color="gray.400" fontWeight="bold" fontSize="14px" fontFamily={bodyFont}>
                            Giỏ hàng đang trống. Hãy thêm món ăn yêu thích vào giỏ để tiếp tục đặt hàng!
                        </Text>
                    ) : (
                        <Box overflowX="auto">
                            <Table variant="simple" size="sm">
                                <Thead bg={omegaGrayBg}>
                                    <Tr>
                                        <Th color="#222" fontWeight="800" fontSize="11px" py="12px" fontFamily={bodyFont}>MÓN ĂN</Th>
                                        <Th color="#222" fontWeight="800" fontSize="11px" py="12px" fontFamily={bodyFont}>GIÁ BÁN</Th>
                                        <Th color="#222" fontWeight="800" fontSize="11px" py="12px" textAlign="center" fontFamily={bodyFont}>SỐ LƯỢNG</Th>
                                        <Th color="#222" fontWeight="800" fontSize="11px" py="12px" fontFamily={bodyFont}>TỔNG CỘNG</Th>
                                        <Th color="#222" fontWeight="800" fontSize="11px" py="12px" textAlign="center" fontFamily={bodyFont}>XÓA</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {cart.map(item => {
                                        const foodImg = formatImageUrl(item.imageUrl || item.image || item.food?.imageUrl);

                                        return (
                                            <Tr key={item.foodId} _hover={{ bg: "gray.50" }} borderBottom="1px solid #EAEAEA">
                                                <Td py="15px" pl="0px">
                                                    <HStack spacing="12px">
                                                        <Image
                                                            src={foodImg}
                                                            fallbackSrc={DEFAULT_FOOD_IMAGE}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = DEFAULT_FOOD_IMAGE;
                                                            }}
                                                            w="60px"
                                                            h="60px"
                                                            objectFit="cover"
                                                            borderRadius="4px"
                                                            border="1px solid #EAEAEA"
                                                        />
                                                        <Text fontWeight="800" color="#222" fontSize="13px" textTransform="uppercase" fontFamily={bodyFont}>{item.foodName}</Text>
                                                    </HStack>
                                                </Td>
                                                <Td color="gray.700" fontWeight="700" fontSize="13px" fontFamily={bodyFont}>{item.price?.toLocaleString('vi-VN')}đ</Td>
                                                <Td>
                                                    <HStack justify="center" spacing="0">
                                                        <Button size="xs" variant="outline" borderRadius="0px" borderColor="#CCC" onClick={() => updateQuantity(item.foodId, item.quantity - 1)}>-</Button>
                                                        <Text fontWeight="bold" px="12px" fontSize="13px" color="#222" borderTop="1px solid #CCC" borderBottom="1px solid #CCC" h="24px" display="flex" alignItems="center" fontFamily={bodyFont}>{item.quantity}</Text>
                                                        <Button size="xs" variant="outline" borderRadius="0px" borderColor="#CCC" onClick={() => updateQuantity(item.foodId, item.quantity + 1)}>+</Button>
                                                    </HStack>
                                                </Td>
                                                <Td fontWeight="800" color="#A81D1D" fontSize="14px" fontFamily={bodyFont}>
                                                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                                </Td>
                                                <Td textAlign="center">
                                                    <IconButton size="sm" variant="ghost" colorScheme="red" icon={<MdDelete size="18px" />} onClick={() => removeFromCart(item.foodId)} _hover={{ bg: 'red.50' }} />
                                                </Td>
                                            </Tr>
                                        );
                                    })}
                                </Tbody>
                            </Table>
                        </Box>
                    )}
                </Box>

                <Box flex={1} bg="white" border="1px solid #EAEAEA" p="20px" h="fit-content" borderRadius="8px">
                    <Text fontSize="14px" fontWeight="800" color="#222222" mb="20px" textTransform="uppercase" borderBottom="2px solid #EAEAEA" pb="10px" letterSpacing="0.5px" fontFamily={bodyFont}>
                        THÔNG TIN GIAO HÀNG
                    </Text>

                    <form onSubmit={handleCheckout}>
                        <VStack spacing="15px" align="stretch">
                            <Box>
                                <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase" fontFamily={bodyFont}>SỐ ĐIỆN THOẠI NHẬN HÀNG <Text as="span" color="red.500">*</Text></Text>
                                <Input variant="outline" borderRadius="4px" focusBorderColor={omegaGreen} h="40px" fontSize="13px" placeholder="Nhập số điện thoại di động..." required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} fontFamily={bodyFont} />
                            </Box>

                            <Box>
                                <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase" fontFamily={bodyFont}>ĐỊA CHỈ CHI TIẾT <Text as="span" color="red.500">*</Text></Text>
                                <Input variant="outline" borderRadius="4px" focusBorderColor={omegaGreen} h="40px" fontSize="13px" placeholder="Số nhà, tên đường, khu phố..." required value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} fontFamily={bodyFont} />
                            </Box>

                            <Box borderTop="1px solid #EAEAEA" pt="15px" mt="10px">
                                <Flex justify="space-between" mb="10px">
                                    <Text fontWeight="700" fontSize="12px" color="gray.500" fontFamily={bodyFont}>TẠM TÍNH:</Text>
                                    <Text fontWeight="700" fontSize="13px" color="#222" fontFamily={bodyFont}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
                                </Flex>
                                <Flex justify="space-between" mb="20px">
                                    <Text fontWeight="800" fontSize="13px" color="#222" fontFamily={bodyFont}>THÀNH TIỀN:</Text>
                                    <Text fontWeight="700" fontSize="22px" fontFamily="'Oswald', sans-serif" color="#A81D1D" lineHeight="1">
                                        {totalPrice.toLocaleString('vi-VN')}đ
                                    </Text>
                                </Flex>
                            </Box>

                            <Button type="submit" bg={omegaGreen} color="white" _hover={{ bg: '#610404' }} size="lg" fontSize="12px" fontWeight="800" borderRadius="4px" h="45px" w="100%" isLoading={isSubmitting} loadingText="ĐANG XỬ LÝ ĐƠN HÀNG..." fontFamily={bodyFont}>
                                XÁC NHẬN ĐẶT ĐƠN
                            </Button>
                        </VStack>
                    </form>
                </Box>
            </Flex>

            <Box borderTop="1px solid #EAEAEA" mt="60px" py="20px" textAlign="center" fontSize="11px" color="gray.400" fontWeight="bold" fontFamily={bodyFont}>
                Copyright © 2026 honvietfoods. Powered by Yuri Project
            </Box>
        </Box>
    );
}