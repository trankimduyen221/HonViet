/* eslint-disable */
import {
    Flex,
    Box,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    Avatar,
    Badge,
    Button,
    useToast,
    IconButton,
    Center,
    Spinner,
    Input,
    Select,
    HStack,
    Image,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider
} from '@chakra-ui/react';
import * as React from 'react';
import { MdDelete, MdEdit } from 'react-icons/md';
import { useNavigate } from "react-router-dom";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

import logoLotus from "../../assets/logo.jpg";

const columnHelper = createColumnHelper();

export default function UserManager() {
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [sorting, setSorting] = React.useState([]);

    // State quản lý chỉnh sửa thành viên
    const [editingUserId, setEditingUserId] = React.useState(null);
    const [editForm, setEditForm] = React.useState({
        username: '',
        email: '',
        role: ''
    });

    const toast = useToast();
    const navigate = useNavigate();

    // Đồng bộ cấu trúc màu sắc từ hệ thống Hồn Việt
    const omegaGreen = '#930a0a';
    const omegaBlue = '#1A365D';
    const omegaGrayBg = '#F5F5F5';
    const currentUsername = localStorage.getItem('username') || 'Admin';

    // Tự động kiểm tra cả 2 trường hợp lưu key token của hệ thống
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

    // 1. GỌI API LẤY DANH SÁCH (GET /api/users)
    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/users', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                throw new Error("Không có quyền truy cập hoặc phiên làm việc hết hạn");
            }
        } catch (err) {
            console.error("Lỗi tải danh sách người dùng:", err);
            toast({
                title: "Lỗi bảo mật",
                description: "Tài khoản của bạn không đủ quyền ADMIN hoặc Token đã hết hạn!",
                status: "error",
                position: "top"
            });
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (token) {
            loadUsers();
        } else {
            toast({ title: "Cảnh báo", description: "Vui lòng đăng nhập với tài khoản Admin!", status: "warning", position: "top" });
            setLoading(false);
        }
    }, [token]);

    const handleLogout = () => {
        localStorage.clear();
        toast({ title: "Đã đăng xuất", status: "info", duration: 2000, position: "top" });
        navigate("/login");
    };

    // 2. KÍCH HOẠT CHẾ ĐỘ SỬA
    const startEdit = (user) => {
        setEditingUserId(user.userId);
        setEditForm({
            username: user.username,
            email: user.email,
            role: user.role || 'USER'
        });
    };

    // HỦY CHẾ ĐỘ SỬA
    const cancelEdit = () => {
        setEditingUserId(null);
        setEditForm({ username: '', email: '', role: '' });
    };

    // 3. XỬ LÝ LƯU THAY ĐỔI (Đã đổi sang gọi đúng API Admin Update mới)
    const handleSaveEdit = async (e) => {
        e.preventDefault();

        const originalUser = users.find(u => u.userId === editingUserId);
        if (!originalUser) return;

        // Đóng gói dữ liệu thay đổi để gửi lên
        const updatedUserPayload = {
            username: editForm.username,
            email: editForm.email,
            role: editForm.role
        };

        try {
            // 💡 Gọi chính xác tới đường dẫn PUT admin-update của id cần sửa
            const response = await fetch(`http://localhost:8080/api/users/admin-update/${editingUserId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedUserPayload)
            });

            if (response.ok) {
                toast({ title: "Thành công", description: "Đã cập nhật thông tin thành viên", status: "success", position: "top" });
                cancelEdit();
                loadUsers(); // Tải lại danh sách mới cập nhật
            } else {
                const errorText = await response.text();
                toast({ title: "Thất bại", description: errorText || "Cập nhật dữ liệu không thành công", status: "error", position: "top" });
            }
        } catch (err) {
            console.error("Lỗi cập nhật user:", err);
            toast({ title: "Lỗi kết nối", description: "Không thể kết nối đến máy chủ", status: "error", position: "top" });
        }
    };

    // 4. HÀM ADMIN XÓA TÀI KHOẢN (DELETE /api/users/admin-delete/{id})
    const handleDelete = async (userId, username) => {
        if (window.confirm(`Bạn có chắc muốn xóa tài khoản [${username}]?`)) {
            try {
                const response = await fetch(`http://localhost:8080/api/users/admin-delete/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    toast({ title: "Thành công", description: `Đã loại bỏ tài khoản ${username}`, status: "success", position: "top" });
                    if (editingUserId === userId) cancelEdit();
                    loadUsers();
                } else {
                    toast({ title: "Thất bại", description: "Không thể xóa hoặc tài khoản không tồn tại.", status: "error", position: "top" });
                }
            } catch (err) {
                console.error("Lỗi khi xóa user:", err);
            }
        }
    };

    const columns = [
        columnHelper.accessor('avatar', {
            id: 'avatar',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">AVATAR</Text>,
            cell: (info) => (
                <Avatar
                    size="sm"
                    src={info.getValue() || ""}
                    name={info.row.original.username}
                />
            ),
        }),
        columnHelper.accessor('username', {
            id: 'username',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">USERNAME</Text>,
            cell: (info) => <Text color="#222" fontSize="12px" fontWeight="800">{info.getValue()}</Text>,
        }),
        columnHelper.accessor('email', {
            id: 'email',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">EMAIL</Text>,
            cell: (info) => <Text color="gray.500" fontSize="12px" fontWeight="500">{info.getValue() || '---'}</Text>,
        }),
        columnHelper.accessor('role', {
            id: 'role',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">QUYỀN HẠN</Text>,
            cell: (info) => {
                let roleStr = info.getValue() || 'USER';
                let roleUpper = roleStr.toUpperCase();

                // 🛠️ ĐỒNG BỘ: Nếu DB trả về CUSTOMER hoặc USER thì ép chung về hiển thị chữ "USER"
                if (roleUpper.includes('CUSTOMER') || roleUpper === 'USER') {
                    roleUpper = 'USER';
                }

                // Cấu hình màu sắc hiển thị trực quan
                let colorScheme = 'green'; // Mặc định cho USER
                if (roleUpper.includes('ADMIN')) colorScheme = 'purple';
                else if (roleUpper.includes('SHIPPER')) colorScheme = 'blue';

                return (
                    <Badge colorScheme={colorScheme} px="8px" py="2px" borderRadius="0px" fontSize="10px" fontWeight="800">
                        {roleUpper}
                    </Badge>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800" textAlign="center">THAO TÁC</Text>,
            cell: (info) => (
                <Flex justify="center" gap="5px">
                    <IconButton
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        borderRadius="0px"
                        icon={<MdEdit size="16px" />}
                        onClick={() => startEdit(info.row.original)}
                        title="Sửa quyền/Thông tin"
                    />
                    <IconButton
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        borderRadius="0px"
                        icon={<MdDelete size="18px" />}
                        onClick={() => handleDelete(info.row.original.userId, info.row.original.username)}
                        title="Xóa tài khoản"
                    />
                </Flex>
            ),
        }),
    ];

    const table = useReactTable({
        data: users,
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
                <Text fontSize="13px" fontWeight="bold" color="gray.600">ĐANG ĐỒNG BỘ THÀNH VIÊN HỒN VIỆT...</Text>
            </Center>
        );
    }

    return (
        <Box bg="white" minH="100vh">
            <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;900&family=Oswald:wght@500;700&family=Quicksand:wght@700&display=swap" rel="stylesheet" />

            {/* Top Banner Thương hiệu */}
            <Box bg={omegaGreen} color="white" py="10px" textAlign="center" fontSize="13px" fontWeight="bold" letterSpacing="1.5px">
                HỒN VIỆT — MỸ VỊ CHÍNH THỐNG ĐẬM ĐÀ QUÊ HƯƠNG (DASHBOARD)
            </Box>

            {/* Header / Thanh điều hướng chính */}
            <Box bg="white" borderBottom="1px solid #EDEDED" py="12px" px={{ base: '15px', md: '30px' }} position="sticky" top="0" zIndex="10">
                <Flex maxW="1600px" mx="auto" align="center" justify="space-between">
                    <HStack spacing="12px" cursor="pointer" onClick={() => navigate("/client/food-menu")}>
                        <Image src={logoLotus} alt="Hon Viet Logo" boxSize="50px" objectFit="contain" />
                        <Box display={{ base: 'none', sm: 'block' }}>
                            <Text fontSize="18px" fontFamily='"Comfortaa", "Quicksand", "Segoe UI", sans-serif' fontWeight="900" color={omegaGreen} letterSpacing="0.5px" lineHeight="none">HỒN VIỆT</Text>
                            <Text fontSize="9px" color="gray.500" fontWeight="bold" letterSpacing="0.5px" mt="2px">SINCE 2026</Text>
                        </Box>
                    </HStack>

                    <HStack spacing="15px" fontSize="12px" fontWeight="800">
                        <Text cursor="pointer" color="gray.500" _hover={{ color: omegaGreen }} onClick={() => navigate("/admin/foods")}>MÓN ĂN</Text>
                        <Text cursor="pointer" color="gray.500" _hover={{ color: omegaGreen }} onClick={() => navigate("/admin/categories")}>DANH MỤC</Text>
                        <Text cursor="pointer" color="gray.500" _hover={{ color: omegaGreen }} onClick={() => navigate("/admin/orders")}>ĐƠN HÀNG</Text>
                        <Text cursor="pointer" color={omegaGreen} borderBottom={`2px solid ${omegaGreen}`} pb="2px">THÀNH VIÊN</Text>
                    </HStack>

                    <HStack spacing="15px">
                        <Menu isLazy placement="bottom-end">
                            <MenuButton as={Button} variant="ghost" h="auto" p="0" _hover={{ opacity: 0.85 }}>
                                <HStack spacing="10px">
                                    <Text fontSize="12px" fontWeight="800" color="gray.700" display={{ base: 'none', md: 'block' }}>{currentUsername}</Text>
                                    <Avatar name={currentUsername} size="sm" bg={omegaGreen} color="white" fontWeight="bold" />
                                </HStack>
                            </MenuButton>
                            <MenuList borderRadius="0px" border="1px solid #EAEAEA" py="0px" zIndex="11">
                                <Box px="15px" py="12px" bg="gray.50">
                                    <Text fontSize="10px" fontWeight="bold" color="gray.400">ĐANG ĐĂNG NHẬP</Text>
                                    <Text fontSize="13px" fontWeight="800" color="#222" mt="2px">{currentUsername}</Text>
                                </Box>
                                <MenuDivider m="0" borderColor="#EAEAEA" />
                                <MenuItem fontSize="12px" fontWeight="800" color="red.600" py="10px" onClick={handleLogout}>ĐĂNG XUẤT</MenuItem>
                            </MenuList>
                        </Menu>
                    </HStack>
                </Flex>
            </Box>

            {/* Breadcrumb điều hướng phụ */}
            <Box bg={omegaGrayBg} py="10px" px={{ base: '15px', md: '30px' }}>
                <HStack maxW="1600px" mx="auto" fontSize="12px" color="gray.500" fontWeight="600">
                    <Text cursor="pointer" onClick={() => navigate("/client/food-menu")}>Trang chủ</Text>
                    <Text>/</Text>
                    <Text color="gray.800">Quản lý thành viên hệ thống</Text>
                </HStack>
            </Box>

            {/* Nội dung chính kết hợp Form và Bảng */}
            <Flex direction={{ base: 'column', md: 'row' }} gap="30px" align="flex-start" p={{ base: '20px 15px', md: '40px 30px' }} maxW="1600px" mx="auto">

                {/* FORM CHỈNH SỬA THÀNH VIÊN (HIỂN THỊ KHI BẤM NÚT SỬA) */}
                {editingUserId && (
                    <Box flex={1} bg="white" border="1px solid #EAEAEA" p="24px" w="100%" borderRadius="0px">
                        <Text fontSize="13px" fontWeight="800" color="blue.700" textTransform="uppercase" letterSpacing="0.5px" mb="20px" pb="10px" borderBottom="2px solid #EAEAEA">
                            CHỈNH SỬA THÀNH VIÊN
                        </Text>
                        <form onSubmit={handleSaveEdit}>
                            <Flex direction="column" gap="15px">
                                <Box>
                                    <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase">Tên tài khoản</Text>
                                    <Input
                                        variant="outline" borderRadius="0px" focusBorderColor="blue.500" h="40px" fontSize="13px"
                                        value={editForm.username}
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                        required
                                    />
                                </Box>
                                <Box>
                                    <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase">Email liên hệ</Text>
                                    <Input
                                        variant="outline" borderRadius="0px" focusBorderColor="blue.500" h="40px" fontSize="13px" type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        required
                                    />
                                </Box>
                                <Box>
                                    <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase">Phân quyền tài khoản *</Text>
                                    <Select
                                        variant="outline" borderRadius="0px" focusBorderColor="blue.500" h="40px" fontSize="13px" fontWeight="700"
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    >
                                        <option value="USER">USER (Khách hàng)</option>
                                        <option value="SHIPPER">SHIPPER (Giao hàng)</option>
                                        <option value="ADMIN">ADMIN (Quản trị viên)</option>
                                    </Select>
                                </Box>
                                <HStack spacing="10px" pt="5px">
                                    <Button type="submit" bg={omegaBlue} color="white" _hover={{ bg: "#0F2340" }} size="lg" fontSize="12px" fontWeight="800" borderRadius="0px" h="45px" flex={2}>
                                        LƯU THAY ĐỔI
                                    </Button>
                                    <Button type="button" onClick={cancelEdit} bg="gray.400" color="white" _hover={{ bg: "gray.500" }} size="lg" fontSize="12px" fontWeight="800" borderRadius="0px" h="45px" flex={1}>
                                        HỦY
                                    </Button>
                                </HStack>
                            </Flex>
                        </form>
                    </Box>
                )}

                {/* DANH SÁCH BẢNG HIỂN THỊ THÀNH VIÊN */}
                <Box flex={2} bg="white" border="1px solid #EAEAEA" p="24px" w="100%" borderRadius="0px">
                    <Text fontSize="13px" fontWeight="800" color="#222" textTransform="uppercase" letterSpacing="0.5px" mb="20px" pb="10px" borderBottom="2px solid #EAEAEA">
                        DANH SÁCH THÀNH VIÊN ({users.length})
                    </Text>
                    <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead bg={omegaGrayBg}>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <Tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <Th key={header.id} py="12px" borderColor="#EAEAEA">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </Th>
                                        ))}
                                    </Tr>
                                ))}
                            </Thead>
                            <Tbody>
                                {users.length === 0 ? (
                                    <Tr>
                                        <Td colSpan="5" textAlign="center" py="40px" fontSize="12px" fontWeight="bold" color="gray.400">
                                            Không có dữ liệu tài khoản nào khả dụng trên hệ thống.
                                        </Td>
                                    </Tr>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <Tr key={row.id} _hover={{ bg: "gray.50" }} borderBottom="1px solid #EAEAEA" bg={editingUserId === row.original.userId ? "blue.50" : "transparent"}>
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
            </Flex>

            {/* Chân trang đồng bộ */}
            <Box bg="white" borderTop="1px solid #EAEAEA" py="20px" textAlign="center" fontSize="11px" color="gray.400" fontWeight="bold">
                Copyright © 2026 honvietfoods. Powered by Yuri Project (Hệ thống quản trị nội bộ)
            </Box>
        </Box>
    );
}