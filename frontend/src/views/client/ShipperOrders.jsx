/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiTruck, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
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
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Avatar,
    MenuDivider,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    VStack,
    Tag
} from '@chakra-ui/react';
import axios from 'axios';

// Import tài nguyên logo
import logoLotus from '../../assets/logo.jpg';

export default function ShipperOrders() {
    const [availableOrders, setAvailableOrders] = useState([]); // Đơn hàng chờ shipper nhận
    const [myDeliveringOrders, setMyDeliveringOrders] = useState([]); // Đơn shipper đang giao
    const [historyOrders, setHistoryOrders] = useState([]); // Lịch sử đơn đã giao/hủy
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const navigate = useNavigate();
    const toast = useToast();

    const token = localStorage.getItem('accessToken');
    const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username'));
    const [currentAvatar, setCurrentAvatar] = useState(localStorage.getItem('avatar') || '');
    const userRole = localStorage.getItem('role') || '';

    const omegaGreen = '#930a0a';

    // 1. Bảo vệ Tuyến đường: Đảm bảo người dùng đã đăng nhập
    useEffect(() => {
        if (!token) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập với tài khoản Shipper!",
                status: "warning",
                duration: 3000,
                position: "top"
            });
            navigate('/client/auth');
        }
    }, [token, navigate, toast]);

    // Lắng nghe thay đổi localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            setCurrentUsername(localStorage.getItem('username'));
            setCurrentAvatar(localStorage.getItem('avatar') || '');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // 2. Lấy dữ liệu danh sách đơn cho Shipper từ Backend
    const fetchShipperData = async () => {
        setLoading(true);
        try {
            // Lấy danh sách từ API công khai hoặc API shipper
            const response = await axios.get('http://localhost:8080/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const allOrders = response.data || [];

            // Chuẩn hóa dữ liệu để tránh mismatch tên trường từ Spring Boot
            const normalizedOrders = allOrders.map(order => ({
                id: order.id || order.orderId || order.order_id,
                customer: order.customerName || order.receiverName || order.user?.username || order.username || 'Khách vãng lai',
                phone: order.phoneNumber || order.phone || order.receiverPhone || 'N/A',
                address: order.shippingAddress || order.address || order.receiverAddress || 'Chưa cập nhật địa chỉ',
                price: order.totalPrice || order.totalAmount || order.total || order.amount || 0,
                statusStr: String(order.status || '').toLowerCase().trim(),
                foodDetail: order.foodName || order.orderDetails?.[0]?.food?.name || order.itemsDescription || 'Món ăn Hồn Việt',
                quantity: order.quantity || order.orderDetails?.[0]?.quantity || 1,
                original: order
            }));

            // 1. Đơn chờ nhận: Trạng thái 'pending', 'chờ xử lý', 'cho xu ly'
            const available = normalizedOrders.filter(o =>
                ['pending', 'chờ xử lý', 'cho xu ly', 'wait'].includes(o.statusStr)
            );

            // 2. Đơn đang giao: Trạng thái 'delivering', 'đang giao', 'dang giao'
            const delivering = normalizedOrders.filter(o =>
                ['delivering', 'đang giao', 'dang giao', 'shipping'].includes(o.statusStr)
            );

            // 3. Lịch sử đơn: Trạng thái thành công hoặc đã hủy
            const history = normalizedOrders.filter(o =>
                ['success', 'canceled', 'cancelled', 'thành công', 'thanh cong', 'đã hủy', 'da huy'].includes(o.statusStr)
            );

            setAvailableOrders(available);
            setMyDeliveringOrders(delivering);
            setHistoryOrders(history);

        } catch (err) {
            console.error('Lỗi tải danh sách đơn Shipper:', err);
            toast({
                title: "Lỗi kết nối",
                description: "Không thể lấy dữ liệu đơn hàng!",
                status: "error",
                duration: 3000,
                position: "top"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchShipperData();
        }
    }, [token]);

    // 3. Xử lý Cập nhật Trạng thái Đơn hàng
    const handleUpdateStatus = async (orderId, newStatus) => {
        setActionLoadingId(orderId);
        try {
            const res = await axios.put(
                `http://localhost:8080/api/orders/${orderId}/shipper-status?status=${newStatus}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast({
                title: "Cập nhật thành công",
                description: typeof res.data === 'string' ? res.data : "Trạng thái đơn hàng đã được cập nhật!",
                status: "success",
                duration: 2500,
                position: "top"
            });

            await fetchShipperData();
        } catch (err) {
            // Trường hợp endpoint shipper-status chưa có, fallback sang endpoint update chung
            try {
                await axios.put(
                    `http://localhost:8080/api/orders/${orderId}/status?status=${newStatus}`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast({
                    title: "Cập nhật thành công",
                    status: "success",
                    duration: 2500,
                    position: "top"
                });
                await fetchShipperData();
            } catch (fallbackErr) {
                toast({
                    title: "Thao tác thất bại",
                    description: err.response?.data?.message || err.response?.data || "Có lỗi xảy ra khi cập nhật đơn hàng!",
                    status: "error",
                    duration: 3000,
                    position: "top"
                });
            }
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        localStorage.removeItem('avatar');
        localStorage.removeItem('role');
        toast({
            title: "Đã đăng xuất",
            description: "Đăng xuấtMthành công!",
            status: "info",
            duration: 2000,
            position: "top"
        });
        navigate("/client/auth");
    };

    if (loading) {
        return (
            <Center minH="100vh" flexDirection="column" gap={3}>
                <Spinner size="xl" color={omegaGreen} thickness="4px" />
                <Text fontWeight="semibold" color="gray.600">Đang tải danh sách giao hàng Shipper...</Text>
            </Center>
        );
    }

    return (
        <Box bg="#F9FAFB" minH="100vh">
            <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;900&family=Oswald:wght@500;700&family=Quicksand:wght@600;700;900&display=swap" rel="stylesheet" />

            {/* TOP BAR */}
            <Box bg={omegaGreen} color="white" py="10px" textAlign="center" fontSize="13px" fontWeight="bold" letterSpacing="1.5px">
                HỒN VIỆT — HỆ THỐNG ĐIỀU HÀNH GIAO HÀNG
            </Box>

            {/* HEADER */}
            <Box bg="white" borderBottom="1px solid #EDEDED" py="12px" px={{ base: '15px', md: '30px' }} position="sticky" top="0" zIndex="10" boxShadow="sm">
                <Flex maxW="1400px" mx="auto" align="center" justify="space-between">
                    <HStack spacing="12px" cursor="pointer" onClick={() => navigate('/')}>
                        <Image src={logoLotus} alt="Hon Viet Logo" boxSize="50px" objectFit="contain" />
                        <Box display={{ base: 'none', sm: 'block' }}>
                            <Text fontSize="18px" fontFamily='"Comfortaa", "Quicksand", sans-serif' fontWeight="900" color={omegaGreen} lineHeight="none">
                                HỒN VIỆT
                            </Text>
                            <Text fontSize="9px" color="gray.500" fontWeight="bold" mt="2px">SHIPPER WORKSPACE</Text>
                        </Box>
                    </HStack>

                    <HStack spacing="20px">
                        <Button
                            leftIcon={<FiRefreshCw />}
                            size="sm"
                            variant="outline"
                            colorScheme="red"
                            onClick={fetchShipperData}
                        >
                            Làm mới
                        </Button>

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
                                    <IconButton icon={<FiUser size="20px" />} aria-label="Account" variant="solid" bg="#EFEFEF" color="#333" borderRadius="full" boxSize="45px" />
                                )}
                            </MenuButton>
                            <MenuList minW="185px" borderRadius="12px" border="1px solid #EAEAEA" boxShadow="0 10px 30px rgba(0, 0, 0, 0.08)" py="4px">
                                <Box px="14px" py="8px" bg="gray.50">
                                    <Text fontSize="10px" fontWeight="700" color="gray.400" letterSpacing="0.8px">SHIPPER ĐANG TRỰC</Text>
                                    <Text fontSize="13px" fontWeight="800" color="gray.800" mt="1px">{currentUsername}</Text>
                                    <Tag size="sm" colorScheme="orange" mt="4px" fontWeight="bold">
                                        {userRole.toUpperCase() || 'SHIPPER'}
                                    </Tag>
                                </Box>
                                <MenuDivider borderColor="#EAEAEA" my="4px" />
                                <MenuItem fontSize="13px" fontWeight="600" color="gray.700" py="8px" px="14px" onClick={() => navigate("/client/profile")}>⚙️ Hồ sơ cá nhân</MenuItem>
                                <MenuDivider borderColor="#EAEAEA" my="4px" />
                                <MenuItem fontSize="13px" fontWeight="700" color="red.600" py="8px" px="14px" _hover={{ bg: 'red.50' }} onClick={handleLogout}>Đăng xuất</MenuItem>
                            </MenuList>
                        </Menu>
                    </HStack>
                </Flex>
            </Box>

            {/* CHỨC NĂNG CHÍNH DÀNH CHO SHIPPER */}
            <Box maxW="1200px" mx="auto" px={{ base: '15px', md: '30px' }} py="30px">
                <Box mb="25px">
                    <Text fontSize="26px" fontWeight="900" fontFamily='"Comfortaa", sans-serif' color="#222">
                        🛵 QUẢN LÝ ĐƠN HÀNG VẬN CHUYỂN
                    </Text>
                    <Text fontSize="14px" color="gray.500" mt="4px" fontWeight="600">
                        Nhận đơn, điều phối tuyến đường và xác nhận giao hàng cho Hồn Việt Foods
                    </Text>
                </Box>

                <Tabs variant="soft-rounded" colorScheme="red" defaultIndex={myDeliveringOrders.length > 0 ? 1 : 0}>
                    <TabList bg="white" p="6px" borderRadius="12px" border="1px solid #EAEAEA" mb="25px" display="flex" overflowX="auto">
                        <Tab fontWeight="800" fontSize="13px">
                            📋 Đơn chờ nhận giao ({availableOrders.length})
                        </Tab>
                        <Tab fontWeight="800" fontSize="13px">
                            🛵 Đơn tôi đang giao ({myDeliveringOrders.length})
                        </Tab>
                        <Tab fontWeight="800" fontSize="13px">
                            ✅ Lịch sử giao ({historyOrders.length})
                        </Tab>
                    </TabList>

                    <TabPanels>
                        {/* TAB 1: ĐƠN HÀNG CHỜ NHẬN GIAO */}
                        <TabPanel p={0}>
                            {availableOrders.length === 0 ? (
                                <Center py="70px" bg="white" border="1px solid #EAEAEA" borderRadius="12px" flexDirection="column">
                                    <Text fontSize="45px">☕</Text>
                                    <Text color="gray.500" fontWeight="bold" mt="10px">Hiện chưa có đơn hàng mới cần giao</Text>
                                    <Button mt="15px" size="sm" onClick={fetchShipperData} colorScheme="gray">Làm mới danh sách</Button>
                                </Center>
                            ) : (
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing="20px">
                                    {availableOrders.map((order) => (
                                        <Box key={order.id} bg="white" border="1px solid #EAEAEA" borderRadius="12px" p="20px" boxShadow="sm" display="flex" flexDirection="column" justify="space-between">
                                            <Box>
                                                <Flex justify="space-between" align="center" mb="12px">
                                                    <Text fontWeight="800" fontSize="15px" color="gray.800">MÃ ĐƠN: #{order.id}</Text>
                                                    <Badge colorScheme="yellow" px="8px" py="3px" borderRadius="4px" fontSize="11px">
                                                        CHỜ NHẬN GIAO
                                                    </Badge>
                                                </Flex>

                                                <HStack spacing="8px" mb="6px">
                                                    <Text color="gray.600">👤</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.600">Khách hàng:</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.800">{order.customer}</Text>
                                                </HStack>

                                                <HStack spacing="8px" mb="6px">
                                                    <Text color="gray.600">📞</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.600">SĐT liên hệ:</Text>
                                                    <Text fontSize="13px" fontWeight="800" color="blue.600">{order.phone}</Text>
                                                </HStack>

                                                <HStack spacing="8px" mb="6px" align="flex-start">
                                                    <Text color="red.500">📍</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.600" minW="80px">Địa chỉ giao:</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.800">{order.address}</Text>
                                                </HStack>

                                                <HStack spacing="8px" mb="12px">
                                                    <Text color="green.600">💵</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.600">Tiền thu hộ (COD):</Text>
                                                    <Text fontSize="16px" fontWeight="900" color={omegaGreen}>
                                                        {order.price.toLocaleString('vi-VN')}đ
                                                    </Text>
                                                </HStack>

                                                <Box bg="gray.50" p="10px" borderRadius="8px" mb="15px">
                                                    <Text fontSize="11px" fontWeight="800" color="gray.400" mb="6px">CHI TIẾT MÓN CẦN GIAO:</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.700">
                                                        {order.foodDetail} x{order.quantity}
                                                    </Text>
                                                </Box>
                                            </Box>

                                            <Button
                                                w="100%"
                                                bg={omegaGreen}
                                                color="white"
                                                _hover={{ bg: '#710808' }}
                                                leftIcon={<FiTruck />}
                                                isLoading={actionLoadingId === order.id}
                                                onClick={() => handleUpdateStatus(order.id, 'Delivering')}
                                            >
                                                Nhận giao đơn này
                                            </Button>
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            )}
                        </TabPanel>

                        {/* TAB 2: ĐƠN SHIPPER ĐANG GIAO */}
                        <TabPanel p={0}>
                            {myDeliveringOrders.length === 0 ? (
                                <Center py="70px" bg="white" border="1px solid #EAEAEA" borderRadius="12px" flexDirection="column">
                                    <Text fontSize="45px">🛵</Text>
                                    <Text color="gray.500" fontWeight="bold" mt="10px">Bạn hiện không có đơn hàng nào đang giao</Text>
                                </Center>
                            ) : (
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing="20px">
                                    {myDeliveringOrders.map((order) => (
                                        <Box key={order.id} bg="white" border="2px solid #3182ce" borderRadius="12px" p="20px" boxShadow="md" display="flex" flexDirection="column" justify="space-between">
                                            <Box>
                                                <Flex justify="space-between" align="center" mb="12px">
                                                    <Text fontWeight="800" fontSize="15px" color="gray.800">MÃ ĐƠN: #{order.id}</Text>
                                                    <Badge colorScheme="blue" px="8px" py="3px" borderRadius="4px" fontSize="11px">
                                                        ĐANG GIAO HÀNG
                                                    </Badge>
                                                </Flex>

                                                <HStack spacing="8px" mb="6px">
                                                    <Text>👤</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.600">Khách hàng:</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.800">{order.customer}</Text>
                                                </HStack>

                                                <HStack spacing="8px" mb="6px">
                                                    <Text>📞</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.600">Gọi khách:</Text>
                                                    <Text fontSize="14px" fontWeight="900" color="blue.600">{order.phone}</Text>
                                                </HStack>

                                                <HStack spacing="8px" mb="6px" align="flex-start">
                                                    <Text color="red.500">📍</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.600" minW="80px">Giao tới:</Text>
                                                    <Text fontSize="13px" fontWeight="800" color="gray.800">{order.address}</Text>
                                                </HStack>

                                                <HStack spacing="8px" mb="12px">
                                                    <Text color="green.600">💵</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.600">Tổng thu COD:</Text>
                                                    <Text fontSize="16px" fontWeight="900" color={omegaGreen}>
                                                        {order.price.toLocaleString('vi-VN')}đ
                                                    </Text>
                                                </HStack>

                                                <Box bg="gray.50" p="10px" borderRadius="8px" mb="15px">
                                                    <Text fontSize="11px" fontWeight="800" color="gray.400" mb="6px">SẢN PHẨM GIAO:</Text>
                                                    <Text fontSize="13px" fontWeight="700" color="gray.700">
                                                        {order.foodDetail} x{order.quantity}
                                                    </Text>
                                                </Box>
                                            </Box>

                                            <HStack spacing="10px">
                                                <Button
                                                    flex={1}
                                                    colorScheme="green"
                                                    leftIcon={<FiCheckCircle />}
                                                    isLoading={actionLoadingId === order.id}
                                                    onClick={() => handleUpdateStatus(order.id, 'Success')}
                                                >
                                                    Giao thành công
                                                </Button>
                                                <Button
                                                    flex={1}
                                                    colorScheme="red"
                                                    variant="outline"
                                                    leftIcon={<FiXCircle />}
                                                    isLoading={actionLoadingId === order.id}
                                                    onClick={() => handleUpdateStatus(order.id, 'Canceled')}
                                                >
                                                    Hủy / Thất bại
                                                </Button>
                                            </HStack>
                                        </Box>
                                    ))}
                                </SimpleGrid>
                            )}
                        </TabPanel>

                        {/* TAB 3: LỊCH SỬ GIAO HÀNG */}
                        <TabPanel p={0}>
                            {historyOrders.length === 0 ? (
                                <Center py="70px" bg="white" border="1px solid #EAEAEA" borderRadius="12px" flexDirection="column">
                                    <Text fontSize="45px">📋</Text>
                                    <Text color="gray.500" fontWeight="bold" mt="10px">Chưa có lịch sử giao hàng</Text>
                                </Center>
                            ) : (
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing="20px">
                                    {historyOrders.map((order) => {
                                        const isSuccess = ['success', 'thành công', 'thanh cong'].includes(order.statusStr);
                                        return (
                                            <Box key={order.id} bg="white" border="1px solid #EAEAEA" borderRadius="12px" p="20px" opacity={0.9}>
                                                <Flex justify="space-between" align="center" mb="10px">
                                                    <Text fontWeight="800" fontSize="14px" color="gray.700">MÃ ĐƠN: #{order.id}</Text>
                                                    <Badge colorScheme={isSuccess ? 'green' : 'red'} px="8px" py="3px" borderRadius="4px">
                                                        {isSuccess ? 'GIAO THÀNH CÔNG' : 'ĐÃ HỦY / THẤT BẠI'}
                                                    </Badge>
                                                </Flex>

                                                <Text fontSize="13px" fontWeight="600" color="gray.600" mb="4px">
                                                    Khách hàng: <b>{order.customer}</b>
                                                </Text>
                                                <Text fontSize="13px" fontWeight="600" color="gray.600" mb="4px">
                                                    Địa chỉ: {order.address}
                                                </Text>
                                                <Text fontSize="13px" fontWeight="800" color={omegaGreen}>
                                                    Giá trị: {order.price.toLocaleString('vi-VN')}đ
                                                </Text>
                                            </Box>
                                        );
                                    })}
                                </SimpleGrid>
                            )}
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>

            {/* FOOTER */}
            <Box bg="white" py="30px" textAlign="center" borderTop="1px solid #EAEAEA" mt="60px" fontSize="11px" color="gray.400" fontWeight="bold">
                Copyright © 2026 honvietfoods. Powered by Yuri Project (Shipper Management Console)
            </Box>
        </Box>
    );
}