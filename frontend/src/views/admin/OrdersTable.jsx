/* eslint-disable */
import {
    Box,
    Flex,
    Icon,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    Button,
    Select,
    useToast,
    Spinner,
    Center,
    HStack,
    Image,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Avatar,
    MenuDivider
} from '@chakra-ui/react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import axios from 'axios';
import * as React from 'react';
import { useNavigate } from "react-router-dom";
import { MdCancel, MdCheckCircle, MdOutlineError, MdRefresh } from 'react-icons/md';
import { FiTruck } from 'react-icons/fi';

// Import chính xác các tài nguyên hình ảnh đồng bộ
import logoLotus from "../../assets/logo.jpg";

const columnHelper = createColumnHelper();

export default function OrdersTable() {
    const [orders, setOrders] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [sorting, setSorting] = React.useState([]);
    const toast = useToast();
    const navigate = useNavigate();

    // Hệ màu sắc nhận diện thương hiệu phẳng Hòn Việt
    const omegaGreen = '#930a0a';
    const omegaGrayBg = '#F5F5F5';
    const token = localStorage.getItem('accessToken');
    const currentUsername = localStorage.getItem('username') || 'Admin';

    // XỬ LÝ ĐĂNG XUẤT HỆ THỐNG ĐỒNG BỘ
    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        toast({
            title: "Đã đăng xuất",
            description: "Đăng xuất thành công",
            status: "info",
            duration: 2000,
            position: "top"
        });
        navigate("/login");
    };

    // 1. GỌI API LẤY DANH SÁCH ĐƠN HÀNG
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/api/orders', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setOrders(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Lỗi tải dữ liệu đơn hàng:', err);
            setError('Không thể tải danh sách đơn hàng! Đảm bảo bạn đã đăng nhập tài khoản ADMIN.');
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchOrders();
    }, []);

    // 2. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
    const handleStatusChange = async (orderId, newStatus) => {
        if (!orderId) {
            toast({
                title: "Lỗi dữ liệu",
                description: "ID đơn hàng không hợp lệ (undefined)!",
                status: "warning",
                position: "top"
            });
            return;
        }

        try {
            const response = await axios.put(
                `http://localhost:8080/api/orders/${orderId}/status?status=${newStatus}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                toast({
                    title: "Thành công",
                    description: `Đã chuyển trạng thái đơn hàng sang: ${newStatus}`,
                    status: "success",
                    duration: 2000,
                    position: "top",
                });
                fetchOrders();
            }
        } catch (err) {
            console.error("Lỗi cập nhật trạng thái đơn hàng:", err);
            toast({
                title: "Thất bại",
                description: err.response?.data || "Không thể cập nhật trạng thái đơn hàng!",
                status: "error",
                duration: 2500,
                position: "top",
            });
        }
    };

    const columns = [
        columnHelper.accessor('orderId', {
            id: 'orderId',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">MÃ ĐƠN</Text>,
            cell: (info) => {
                const displayId = info.row.original.orderId || info.row.original.id;
                return (
                    <Text color="gray.600" fontSize="12px" fontWeight="700">
                        #{displayId}
                    </Text>
                );
            },
        }),
        columnHelper.accessor('user', {
            id: 'user',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">KHÁCH HÀNG</Text>,
            cell: (info) => (
                <Text color="#222" fontSize="12px" fontWeight="800">
                    {info.getValue() ? info.getValue().username : 'Ẩn danh'}
                </Text>
            ),
        }),
        columnHelper.accessor('phoneNumber', {
            id: 'phoneNumber',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">SỐ ĐIỆN THOẠI</Text>,
            cell: (info) => (
                <Text color="gray.600" fontSize="12px" fontWeight="600">
                    {info.getValue() || '---'}
                </Text>
            ),
        }),
        columnHelper.accessor('totalPrice', {
            id: 'totalPrice',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">TỔNG TIỀN</Text>,
            cell: (info) => (
                <Text color={omegaGreen} fontSize="13px" fontWeight="700" fontFamily="'Oswald', sans-serif">
                    {info.getValue() ? info.getValue().toLocaleString('vi-VN') : 0}đ
                </Text>
            ),
        }),
        columnHelper.accessor('status', {
            id: 'status',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">TRẠNG THÁI</Text>,
            cell: (info) => {
                const status = info.getValue();
                let iconAs = MdOutlineError;
                let iconColor = 'orange.500';
                let statusText = 'Chờ xử lý';

                if (status === 'Success' || status === 'Sucess') {
                    iconAs = MdCheckCircle;
                    iconColor = 'green.500';
                    statusText = 'Thành công';
                } else if (status === 'Delivering' || status === 'Shipping' || status === 'Đang giao') {
                    iconAs = FiTruck;
                    iconColor = 'blue.500';
                    statusText = 'Đang giao';
                } else if (status === 'Canceled') {
                    iconAs = MdCancel;
                    iconColor = 'red.500';
                    statusText = 'Đã hủy';
                }

                return (
                    <Flex align="center">
                        <Icon w="16px" h="16px" me="6px" color={iconColor} as={iconAs} />
                        <Text color="gray.700" fontSize="12px" fontWeight="700">
                            {statusText}
                        </Text>
                    </Flex>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800" textAlign="center">CẬP NHẬT ĐƠN</Text>,
            cell: (info) => {
                const idToUpdate = info.row.original.orderId || info.row.original.id;

                return (
                    <Flex justify="center">
                        <Select
                            size="xs"
                            w="120px"
                            borderRadius="0px"
                            borderColor="#CCC"
                            focusBorderColor={omegaGreen}
                            fontSize="12px"
                            fontWeight="700"
                            value={info.row.original.status || 'Pending'}
                            onChange={(e) => handleStatusChange(idToUpdate, e.target.value)}
                        >
                            <option value="Pending">Chờ xử lý</option>
                            <option value="Delivering">Đang giao</option>
                            <option value="Success">Thành công</option>
                            <option value="Canceled">Hủy đơn</option>
                        </Select>
                    </Flex>
                );
            },
        }),
    ];

    const table = useReactTable({
        data: orders,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (loading) {
        return (
            <Center p="100px" flexDir="column" minH="100vh">
                <Spinner color={omegaGreen} size="lg" thickness="4px" speed="0.8s" mb={4} />
                <Text fontSize="13px" fontWeight="bold" color="gray.600" letterSpacing="0.5px">ĐANG ĐỒNG BỘ ĐƠN HÀNG HỒN VIỆT...</Text>
            </Center>
        );
    }

    if (error) {
        return (
            <Center p="100px" minH="100vh">
                <Text fontSize="13px" fontWeight="bold" color="red.500">{error}</Text>
            </Center>
        );
    }

    return (
        <Box bg="white" minH="100vh">
            <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;900&family=Oswald:wght@500;700&family=Quicksand:wght@700&display=swap" rel="stylesheet" />

            {/* ===================== HEADER ADMIN ===================== */}
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
                        <Text cursor="pointer" color="gray.500" _hover={{ color: omegaGreen }} onClick={() => navigate("/admin/foods")}>MÓN ĂN</Text>
                        <Text cursor="pointer" color="gray.500" _hover={{ color: omegaGreen }} onClick={() => navigate("/admin/categories")}>DANH MỤC</Text>
                        <Text cursor="pointer" color={omegaGreen} borderBottom={`2px solid ${omegaGreen}`} pb="2px">ĐƠN HÀNG</Text>
                        <Text cursor="pointer" color="gray.500" _hover={{ color: omegaGreen }} onClick={() => navigate("/admin/users")}>THÀNH VIÊN</Text>
                    </HStack>

                    {/* ĐỒNG BỘ HIỂN THỊ TÀI KHOẢN KÈM MENU ĐĂNG XUẤT */}
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
                                <MenuItem fontSize="12px" fontWeight="800" color="red.600" py="10px" _hover={{ bg: 'red.50' }} onClick={handleLogout}>
                                    ĐĂNG XUẤT
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    </HStack>
                </Flex>
            </Box>

            {/* BREADCRUMB */}
            <Box bg={omegaGrayBg} py="10px" px={{ base: '15px', md: '30px' }}>
                <HStack maxW="1600px" mx="auto" fontSize="12px" color="gray.500" fontWeight="600">
                    <Text cursor="pointer" onClick={() => navigate("/client/food-menu")}>Trang chủ</Text>
                    <Text>/</Text>
                    <Text color="gray.800">Quản lý danh sách đơn hàng đặt</Text>
                </HStack>
            </Box>

            {/* BẢNG NỘI DUNG CHÍNH */}
            <Box p={{ base: '20px 15px', md: '40px 30px' }} maxW="1600px" mx="auto">
                <Box bg="white" border="1px solid #EAEAEA" p="24px" borderRadius="0px">
                    <Flex mb="20px" pb="10px" borderBottom="2px solid #EAEAEA" justifyContent="space-between" align="center">
                        <Text fontSize="13px" fontWeight="800" color="#222" textTransform="uppercase" letterSpacing="0.5px">
                            DANH SÁCH ĐƠN HÀNG ({orders.length} đơn)
                        </Text>
                        <Button
                            size="xs"
                            leftIcon={<MdRefresh size="14px" />}
                            bg={omegaGreen}
                            color="white"
                            _hover={{ bg: '#750808' }}
                            borderRadius="0px"
                            fontWeight="800"
                            fontSize="11px"
                            onClick={fetchOrders}
                        >
                            LÀM MỚI DỮ LIỆU
                        </Button>
                    </Flex>

                    <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead bg={omegaGrayBg}>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <Tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <Th
                                                key={header.id}
                                                py="12px"
                                                borderColor="#EAEAEA"
                                                cursor="pointer"
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <Flex justifyContent="space-between" align="center">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted()] ?? null}
                                                </Flex>
                                            </Th>
                                        ))}
                                    </Tr>
                                ))}
                            </Thead>
                            <Tbody>
                                {table.getRowModel().rows.length === 0 ? (
                                    <Tr>
                                        <Td colSpan="6" textAlign="center" py="40px" fontSize="12px" fontWeight="bold" color="gray.400">
                                            Hệ thống chưa ghi nhận dữ liệu đơn hàng nào từ khách hàng.
                                        </Td>
                                    </Tr>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <Tr key={row.id} _hover={{ bg: "gray.50" }} borderBottom="1px solid #EAEAEA">
                                            {row.getVisibleCells().map((cell) => (
                                                <Td key={cell.id} py="14px" borderColor="#EAEAEA">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </Td>
                                            ))}
                                        </Tr>
                                    ))
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                </Box>
            </Box>

            {/* FOOTER */}
            <Box bg="white" borderTop="1px solid #EAEAEA" py="20px" textAlign="center" fontSize="11px" color="gray.400" fontWeight="bold">
                Copyright © 2026 honvietfoods. Powered by Yuri Project (Hệ thống quản trị nội bộ)
            </Box>
        </Box>
    );
}