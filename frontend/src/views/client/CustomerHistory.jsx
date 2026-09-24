/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
    Box, Flex, Text, Badge, Spinner, useToast, Center, Heading,
    VStack, HStack, Image, Icon, SimpleGrid, Divider, Tabs, TabList, TabPanels, Tab, TabPanel, Button,
    Menu, MenuButton, MenuList, MenuItem, MenuDivider, Avatar, IconButton
} from '@chakra-ui/react';
import { MdOutlineReceiptLong, MdLocationOn, MdAttachMoney } from 'react-icons/md';
import { FiUser, FiShoppingCart } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Import tài nguyên hình ảnh logo
import logoLotus from "../../assets/logo.jpg";

export default function CustomerHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeTick, setTimeTick] = useState(Date.now()); // State phụ để tự động re-render đồng hồ đếm ngược
    const [cartCount, setCartCount] = useState(0);
    const toast = useToast();
    const navigate = useNavigate();

    // Link ảnh mặc định phòng trường hợp đường dẫn ảnh của món ăn bị lỗi / 404
    const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=800';

    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username') || sessionStorage.getItem('username') || '');
    const [currentAvatar, setCurrentAvatar] = useState(localStorage.getItem('avatar') || sessionStorage.getItem('avatar') || '');
    const userRole = localStorage.getItem('role') || sessionStorage.getItem('role') || '';

    // Hệ màu sắc nhận diện Hồn Việt
    const omegaGreen = "#930a0a";
    const omegaGrayBg = '#F8F9FA';
    const systemFont = '"Comfortaa", "Quicksand", "Segoe UI", sans-serif';
    const bodyFont = '"Quicksand", sans-serif';

    // Hàm chuẩn hóa đường dẫn ảnh từ Backend gửi về
    const formatImageUrl = (url) => {
        if (!url || typeof url !== 'string' || url.trim() === '') return DEFAULT_FOOD_IMAGE;
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
            return url;
        }
        return `https://honviet-ryt3.onrender.com${url.startsWith('/') ? '' : '/'}${url}`;
    };

    // Đăng ký listener lắng nghe thay đổi localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            setCurrentUsername(localStorage.getItem('username') || sessionStorage.getItem('username') || '');
            setCurrentAvatar(localStorage.getItem('avatar') || sessionStorage.getItem('avatar') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Cập nhật số lượng giỏ hàng
    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('honVietCart')) || [];
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(total);
    };

    useEffect(() => {
        updateCartCount();
    }, []);

    // Tự động cập nhật đồng hồ đếm ngược mỗi 30 giây để nút hủy cập nhật thời gian thực
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeTick(Date.now());
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // 1. Kiểm tra đăng nhập và Phân quyền chuyển hướng đối với ADMIN và SHIPPER
    useEffect(() => {
        if (!token) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập để xem lịch sử mua hàng của bạn!",
                status: "warning",
                position: "top",
                duration: 3000
            });
            navigate("/client/auth");
            return;
        }

        const role = userRole.toUpperCase();
        if (role === 'ADMIN') {
            navigate('/admin/foods');
        } else if (role === 'SHIPPER') {
            navigate('/shipper/orders');
        }
    }, [token, userRole, navigate]);

    // 2. Lấy danh sách đơn hàng cá nhân từ API
    const fetchMyOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get('https://honviet-ryt3.onrender.com/api/users/my-orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Lỗi tải lịch sử đơn hàng:", err);
            toast({
                title: "Không thể lấy dữ liệu",
                description: "Đã xảy ra lỗi khi đồng bộ lịch sử mua hàng của bạn.",
                status: "error",
                position: "top"
            });
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && userRole.toUpperCase() === 'CUSTOMER') {
            fetchMyOrders();
        }
    }, [token, userRole]);

    // 3. Hàm xử lý đăng xuất đồng bộ
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

    // 4. Hàm gọi API hủy đơn hàng
    const handleCancelOrder = async (orderId) => {
        if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderId} không?`)) {
            return;
        }
        try {
            const response = await axios.put(`https://honviet-ryt3.onrender.com/api/orders/${orderId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast({
                title: "Hủy đơn thành công",
                description: response.data,
                status: "success",
                duration: 3000,
                position: "top"
            });
            fetchMyOrders();
        } catch (err) {
            toast({
                title: "Hủy đơn thất bại",
                description: err.response?.data || "Đã xảy ra lỗi khi hủy đơn hàng.",
                status: "error",
                duration: 4000,
                position: "top"
            });
        }
    };

    // Hàm render badge trạng thái đơn hàng
    const renderStatusBadge = (status) => {
        if (status === 'Success' || status === 'Thành công' || status === 'DELIVERED') {
            return (
                <Badge colorScheme="green" variant="subtle" px="8px" py="2px" borderRadius="4px" fontSize="11px">
                    Thành công
                </Badge>
            );
        } else if (status === 'Delivering' || status === 'Shipping' || status === 'Đang giao') {
            return (
                <Badge colorScheme="blue" variant="subtle" px="8px" py="2px" borderRadius="4px" fontSize="11px">
                    Đang giao hàng
                </Badge>
            );
        } else if (status === 'Canceled' || status === 'Đã hủy' || status === 'CANCELLED') {
            return (
                <Badge colorScheme="red" variant="subtle" px="8px" py="2px" borderRadius="4px" fontSize="11px">
                    Đã hủy đơn
                </Badge>
            );
        }
        return (
            <Badge colorScheme="orange" variant="subtle" px="8px" py="2px" borderRadius="4px" fontSize="11px">
                Chờ xử lý
            </Badge>
        );
    };

    // Lọc danh sách đơn hàng theo từng trạng thái để đưa vào các Tab
    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Chờ xử lý' || o.status === 'PENDING');
    const shippingOrders = orders.filter(o => o.status === 'Delivering' || o.status === 'Shipping' || o.status === 'Đang giao');
    const successOrders = orders.filter(o => o.status === 'Success' || o.status === 'Thành công' || o.status === 'DELIVERED');
    const canceledOrders = orders.filter(o => o.status === 'Canceled' || o.status === 'Đã hủy' || o.status === 'CANCELLED');

    // Hàm render danh sách thẻ đơn hàng
    const renderOrderList = (orderList) => {
        if (orderList.length === 0) {
            return (
                <Center minH="30vh" flexDir="column" bg="white" borderRadius="12px" border="1px dashed #DDD" p="20px" mt="20px">
                    <Icon as={MdOutlineReceiptLong} boxSize="50px" color="gray.300" mb="3" />
                    <Text fontFamily={bodyFont} fontWeight="700" color="gray.400">
                        Bạn chưa có đơn hàng nào trong danh mục này.
                    </Text>
                </Center>
            );
        }

        return (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing="20px" mt="20px">
                {orderList.map((order) => {
                    const oId = order.orderId || order.id;

                    // Tính thời gian đếm ngược (10 phút)
                    const orderDate = new Date(order.createdAt);
                    const diffInMinutes = (Date.now() - orderDate) / (1000 * 60);
                    const isWithinTenMinutes = diffInMinutes <= 10;
                    const minutesLeft = Math.max(0, Math.ceil(10 - diffInMinutes));

                    return (
                        <Box
                            key={oId}
                            bg="white"
                            p="20px"
                            borderRadius="8px"
                            boxShadow="0 4px 12px rgba(0,0,0,0.03)"
                            border="1px solid"
                            borderColor="gray.100"
                            position="relative"
                            display="flex"
                            flexDirection="column"
                            justifyContent="space-between"
                        >
                            <Box>
                                <Flex justify="space-between" align="center" mb="12px">
                                    <Text fontWeight="900" fontSize="15px" fontFamily={systemFont} color="#222">
                                        MÃ ĐƠN: #{oId}
                                    </Text>
                                    {renderStatusBadge(order.status)}
                                </Flex>

                                <Divider mb="12px" />

                                <VStack align="start" spacing="8px" mb="15px" fontFamily={bodyFont} fontSize="13px">
                                    <HStack align="start">
                                        <Icon as={MdLocationOn} color="red.500" mt="2px" />
                                        <Text color="gray.600" fontWeight="600">
                                            Giao đến: <Text as="span" color="gray.800" fontWeight="700">{order.shippingAddress || 'Không rõ địa chỉ'}</Text>
                                        </Text>
                                    </HStack>

                                    <HStack>
                                        <Icon as={MdAttachMoney} color="green.600" />
                                        <Text color="gray.600" fontWeight="600">
                                            Tổng thanh toán: <Text as="span" color={omegaGreen} fontWeight="900" fontSize="14px">{(order.totalPrice || 0).toLocaleString('vi-VN')}đ</Text>
                                        </Text>
                                    </HStack>

                                    <Text color="gray.400" fontSize="11px" fontWeight="700" mt="2px">
                                        Thời gian đặt: {order.createdAt || 'Vừa xong'}
                                    </Text>
                                </VStack>

                                {/* Chi tiết sản phẩm trong đơn kèm ảnh hiển thị mượt mà */}
                                {order.orderDetails && order.orderDetails.length > 0 && (
                                    <Box bg="gray.50" p="10px" borderRadius="6px" mb="10px">
                                        <Text fontSize="11px" fontWeight="800" color="gray.500" mb="8px" textTransform="uppercase">Sản phẩm đã mua:</Text>
                                        <VStack align="stretch" spacing="8px">
                                            {order.orderDetails.map((detail, idx) => {
                                                const rawUrl = detail.food?.imageUrl || detail.imageUrl || detail.image;
                                                const foodImg = formatImageUrl(rawUrl);

                                                return (
                                                    <Flex key={idx} justify="space-between" align="center" fontSize="12px" fontFamily={bodyFont}>
                                                        <HStack spacing="10px">
                                                            <Image
                                                                src={foodImg}
                                                                fallbackSrc={DEFAULT_FOOD_IMAGE}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = DEFAULT_FOOD_IMAGE;
                                                                }}
                                                                alt={detail.foodName || detail.food?.foodName || 'Món ăn'}
                                                                boxSize="40px"
                                                                objectFit="cover"
                                                                borderRadius="4px"
                                                                border="1px solid #EAEAEA"
                                                            />
                                                            <Box>
                                                                <Text color="gray.800" fontWeight="800">{detail.foodName || detail.food?.foodName || 'Món ăn'}</Text>
                                                                <Text color="gray.500" fontSize="11px" fontWeight="600">Số lượng: x{detail.quantity}</Text>
                                                            </Box>
                                                        </HStack>
                                                        <Text color={omegaGreen} fontWeight="800">{(detail.price * detail.quantity).toLocaleString('vi-VN')}đ</Text>
                                                    </Flex>
                                                );
                                            })}
                                        </VStack>
                                    </Box>
                                )}
                            </Box>

                            {/* CHỨC NĂNG HỦY ĐƠN HÀNG TRONG 10 PHÚT */}
                            {(order.status === 'Pending' || order.status === 'Chờ xử lý' || order.status === 'PENDING') && (
                                <Box mt="15px" pt="10px" borderTop="1px dashed" borderColor="gray.100">
                                    {isWithinTenMinutes ? (
                                        <Button
                                            size="sm"
                                            colorScheme="red"
                                            width="100%"
                                            fontWeight="bold"
                                            fontFamily={bodyFont}
                                            onClick={() => handleCancelOrder(oId)}
                                        >
                                            Hủy đơn hàng (Còn {minutesLeft} phút)
                                        </Button>
                                    ) : (
                                        <Box>
                                            <Button
                                                size="sm"
                                                colorScheme="gray"
                                                width="100%"
                                                isDisabled
                                                fontWeight="bold"
                                                fontFamily={bodyFont}
                                            >
                                                Không thể hủy (Quá 10 phút)
                                            </Button>
                                            <Text fontSize="10px" color="red.500" textAlign="center" mt="5px" fontWeight="700" fontFamily={bodyFont}>
                                                * Đã quá hạn tự hủy. Vui lòng gọi 1900 55 88 50 để được trợ giúp.
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </SimpleGrid>
        );
    };

    if (loading) {
        return (
            <Center minH="100vh" flexDir="column" gap="4">
                <Spinner size="xl" thickness="4px" speed="0.65s" color={omegaGreen} />
                <Text fontFamily={bodyFont} fontWeight="700" color="gray.500">Đang tải lịch sử mua hàng...</Text>
            </Center>
        );
    }

    return (
        <Box bg="#FAFAFA" minH="100vh" pb="60px">
            <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;900&family=Oswald:wght@500;700&family=Quicksand:wght@600;700;900&display=swap" rel="stylesheet" />

            {/* HEADER BANNER TOP */}
            <Box bg={omegaGreen} color="white" py="10px" textAlign="center" fontSize="13px" fontWeight="bold" letterSpacing="1.5px" fontFamily={bodyFont}>
                HỒN VIỆT — MỸ VỊ CHÍNH THỐNG ĐẬM ĐÀ QUÊ HƯƠNG
            </Box>

            {/* STICKY HEADER NAVBAR ĐỒNG BỘ */}
            <Box bg="white" borderBottom="1px solid #EDEDED" py="12px" px={{ base: '15px', md: '30px' }} position="sticky" top="0" zIndex="10" boxShadow="sm">
                <Flex maxW="1400px" mx="auto" align="center" justify="space-between">
                    <HStack spacing="12px" cursor="pointer" onClick={() => navigate('/')}>
                        <Image src={logoLotus} alt="Hon Viet Logo" boxSize="50px" objectFit="contain" onError={(e) => { e.target.src = "https://placehold.co/100x100?text=HonViet" }} />
                        <Box display={{ base: 'none', sm: 'block' }}>
                            <Text fontSize="18px" fontFamily={systemFont} fontWeight="900" color={omegaGreen} letterSpacing="0.5px" lineHeight="none">
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
                            {/* DROPDOWN MENU TÀI KHOẢN ĐỒNG BỘ HOÀN HẢO */}
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
                                            {userRole.toUpperCase() === 'SHIPPER' && (
                                                <MenuItem fontSize="13px" fontWeight="700" color="blue.600" py="8px" px="14px" _hover={{ bg: 'blue.50' }} onClick={() => navigate("/shipper/orders")}>
                                                    🚚 Trang giao hàng (Shipper)
                                                </MenuItem>
                                            )}
                                            <MenuItem fontSize="13px" fontWeight="600" color="gray.700" py="8px" px="14px" _hover={{ bg: 'gray.50', color: omegaGreen }} onClick={() => navigate("/client/profile")}>
                                                ⚙️ Thông tin cá nhân
                                            </MenuItem>
                                            <MenuItem fontSize="13px" fontWeight="600" color={omegaGreen} bg="red.50" py="8px" px="14px" onClick={() => navigate("/client/orders")}>
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

            {/* BREADCRUMB TINH GỌN */}
            <Box bg={omegaGrayBg} py="10px" px={{ base: '15px', md: '30px' }} borderBottom="1px solid #EAEAEA">
                <HStack maxW="1400px" mx="auto" fontSize="12px" color="gray.500" fontWeight="600" fontFamily={bodyFont}>
                    <Text cursor="pointer" _hover={{ color: omegaGreen }} onClick={() => navigate('/')}>Trang chủ</Text>
                    <Text>/</Text>
                    <Text color="gray.800">Lịch sử đơn hàng của tôi</Text>
                </HStack>
            </Box>

            {/* THÂN TRANG */}
            <Box p={{ base: "20px 15px", md: "40px" }} maxW="1200px" mx="auto">
                <Box mb="25px">
                    <Heading size="lg" color="#222222" fontFamily={systemFont} fontWeight="900" mb="6px">
                        LỊCH SỬ MUA HÀNG
                    </Heading>
                    <Text color="gray.500" fontSize="13px" fontWeight="700" fontFamily={bodyFont}>
                        Theo dõi trạng thái các đơn hàng của bạn tại ẩm thực Hồn Việt
                    </Text>
                    <Divider mt="15px" borderColor="#EAEAEA" />
                </Box>

                {/* TABS LỌC TRẠNG THÁI ĐƠN */}
                <Tabs variant="enclosed" colorScheme="red">
                    <TabList bg="white" p="5px" borderRadius="8px" border="1px solid #EAEAEA" overflowX="auto" whiteSpace="nowrap">
                        <Tab fontSize="13px" fontWeight="800" fontFamily={bodyFont}>Tất cả ({orders.length})</Tab>
                        <Tab fontSize="13px" fontWeight="800" fontFamily={bodyFont}>Chờ xử lý ({pendingOrders.length})</Tab>
                        <Tab fontSize="13px" fontWeight="800" fontFamily={bodyFont}>Đang giao ({shippingOrders.length})</Tab>
                        <Tab fontSize="13px" fontWeight="800" fontFamily={bodyFont}>Thành công ({successOrders.length})</Tab>
                        <Tab fontSize="13px" fontWeight="800" fontFamily={bodyFont}>Đã hủy ({canceledOrders.length})</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel p={0}>{renderOrderList(orders)}</TabPanel>
                        <TabPanel p={0}>{renderOrderList(pendingOrders)}</TabPanel>
                        <TabPanel p={0}>{renderOrderList(shippingOrders)}</TabPanel>
                        <TabPanel p={0}>{renderOrderList(successOrders)}</TabPanel>
                        <TabPanel p={0}>{renderOrderList(canceledOrders)}</TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </Box>
    );
}