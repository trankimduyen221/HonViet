/* eslint-disable */
import {
    Box,
    Flex,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    Input,
    Button,
    HStack,
    useToast,
    Center,
    Spinner,
    Image,
    IconButton,
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
import { MdDelete, MdEdit as EditIcon } from 'react-icons/md';
import * as React from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

import logoLotus from "../../assets/logo.jpg";

const columnHelper = createColumnHelper();

export default function CategoryManager() {
    const [categories, setCategories] = React.useState([]);
    const [categoryName, setCategoryName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [sorting, setSorting] = React.useState([]);

    // State quản lý chế độ Sửa
    const [editingId, setEditingId] = React.useState(null);

    const toast = useToast();
    const navigate = useNavigate();

    const omegaGreen = '#930a0a';
    const omegaBlue = '#1A365D';
    const omegaGrayBg = '#F5F5F5';
    const currentUsername = localStorage.getItem('username') || 'Admin';

    // 💡 HÀM BẮT TOKEN THÔNG MINH (Chống lỗi null/undefined)
    const getAuthToken = () => {
        const token = localStorage.getItem('token')
            || localStorage.getItem('accessToken')
            || localStorage.getItem('jwtToken')
            || localStorage.getItem('jwt');
        return token;
    };

    const loadCategories = async () => {
        setLoading(true);
        try {
            const res = await axios.get('https://honviet-ryt3.onrender.com/api/categories');
            setCategories(res.data);
        } catch (err) {
            console.error("Lỗi tải danh mục:", err);
            toast({
                title: "Lỗi tải dữ liệu",
                description: err.response?.data?.message || "Không thể tải danh sách danh mục từ Server",
                status: "error",
                position: "top"
            });
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadCategories();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        toast({ title: "Đã đăng xuất", status: "info", duration: 2000, position: "top" });
        navigate("/login");
    };

    const startEdit = (category) => {
        setEditingId(Number(category.categoryId));
        setCategoryName(category.categoryName);
        setDescription(category.description || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setCategoryName('');
        setDescription('');
    };

    // XỬ LÝ LƯU (FORM HỢP NHẤT)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) return;

        const token = getAuthToken();
        console.log("Token quét được:", token);

        if (!token) {
            toast({
                title: "Lỗi xác thực (Missing Token)",
                description: "Không tìm thấy Token đăng nhập trong LocalStorage! Vui lòng Đăng xuất và Đăng nhập lại.",
                status: "error",
                position: "top",
                duration: 4000
            });
            return;
        }

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const payload = {
            categoryId: editingId,
            categoryName: categoryName.trim(),
            description: description.trim()
        };

        try {
            if (editingId) {
                // CẬP NHẬT (PUT)
                await axios.put(`https://honviet-ryt3.onrender.com/api/categories/${editingId}`, payload, config);
                toast({ title: "Cập nhật thành công", status: "success", position: "top", duration: 2000 });
            } else {
                // TẠO MỚI (POST)
                await axios.post('https://honviet-ryt3.onrender.com/api/categories', payload, config);
                toast({ title: "Thành công", description: "Đã thêm danh mục mới", status: "success", position: "top", duration: 2000 });
            }

            cancelEdit();
            loadCategories();
        } catch (err) {
            console.error("Lỗi gửi dữ liệu form:", err);
            toast({
                title: `Lỗi Cập Nhật (${err.response?.status || 'Error'})`,
                description: err.response?.data?.message || "Không thể lưu thay đổi. Vui lòng kiểm tra lại Backend!",
                status: "error",
                position: "top",
                duration: 4000
            });
        }
    };

    // XÓA DANH MỤC
    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục [${name}] không?`)) {
            const token = getAuthToken();
            if (!token) {
                toast({ title: "Chưa đăng nhập hoặc thiếu Token", status: "error", position: "top" });
                return;
            }

            try {
                await axios.delete(`https://honviet-ryt3.onrender.com/api/categories/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast({ title: "Đã xóa thành công", status: "info", position: "top", duration: 2000 });
                if (editingId === id) cancelEdit();
                loadCategories();
            } catch (err) {
                toast({
                    title: "Thất bại",
                    description: err.response?.data?.message || "Không thể xóa danh mục này (có thể đang có món ăn sử dụng).",
                    status: "error",
                    position: "top",
                    duration: 4000
                });
            }
        }
    };

    const columns = [
        columnHelper.accessor('categoryId', {
            id: 'categoryId',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">MÃ DANH MỤC</Text>,
            cell: (info) => <Text color="gray.600" fontSize="12px" fontWeight="700">#{info.getValue()}</Text>,
        }),
        columnHelper.accessor('categoryName', {
            id: 'categoryName',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">TÊN DANH MỤC</Text>,
            cell: (info) => <Text color="#222" fontSize="12px" fontWeight="800" textTransform="uppercase">{info.getValue()}</Text>,
        }),
        columnHelper.accessor('description', {
            id: 'description',
            header: () => <Text fontSize="11px" color="#222" fontWeight="800">MÔ TẢ CHI TIẾT</Text>,
            cell: (info) => <Text color="gray.500" fontSize="12px" fontWeight="500" isTruncated maxW="300px">{info.getValue() || "---"}</Text>,
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
                        icon={<EditIcon size="16px" />}
                        onClick={() => startEdit(info.row.original)}
                        title="Sửa danh mục"
                    />
                    <IconButton
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        borderRadius="0px"
                        icon={<MdDelete size="18px" />}
                        onClick={() => handleDelete(info.row.original.categoryId, info.row.original.categoryName)}
                        title="Xóa danh mục"
                    />
                </Flex>
            ),
        }),
    ];

    const table = useReactTable({
        data: categories,
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
                <Text fontSize="13px" fontWeight="bold" color="gray.600">ĐANG ĐỒNG BỘ DANH MỤC HỒN VIỆT...</Text>
            </Center>
        );
    }

    return (
        <Box bg="white" minH="100vh">
            <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;900&family=Oswald:wght@500;700&family=Quicksand:wght@700&display=swap" rel="stylesheet" />

            <Box bg={omegaGreen} color="white" py="10px" textAlign="center" fontSize="13px" fontWeight="bold" letterSpacing="1.5px">
                HỒN VIỆT — MỸ VỊ CHÍNH THỐNG ĐẬM ĐÀ QUÊ HƯƠNG (DASHBOARD)
            </Box>

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
                        <Text cursor="pointer" color={omegaGreen} borderBottom={`2px solid ${omegaGreen}`} pb="2px">DANH MỤC</Text>
                        <Text cursor="pointer" color="gray.500" _hover={{ color: omegaGreen }} onClick={() => navigate("/admin/orders")}>ĐƠN HÀNG</Text>
                        <Text cursor="pointer" color="gray.500" _hover={{ color: omegaGreen }} onClick={() => navigate("/admin/users")}>THÀNH VIÊN</Text>
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

            <Box bg={omegaGrayBg} py="10px" px={{ base: '15px', md: '30px' }}>
                <HStack maxW="1600px" mx="auto" fontSize="12px" color="gray.500" fontWeight="600">
                    <Text cursor="pointer" onClick={() => navigate("/client/food-menu")}>Trang chủ</Text>
                    <Text>/</Text>
                    <Text color="gray.800">Quản lý danh mục thực đơn</Text>
                </HStack>
            </Box>

            <Flex direction={{ base: 'column', md: 'row' }} gap="30px" align="flex-start" p={{ base: '20px 15px', md: '40px 30px' }} maxW="1600px" mx="auto">

                {/* FORM XỬ LÝ (TỰ ĐỘNG BIẾN ĐỔI GIỮA THÊM MỚI / CẬP NHẬT) */}
                <Box flex={1} bg="white" border="1px solid #EAEAEA" p="24px" w="100%" borderRadius="0px">
                    <Text fontSize="13px" fontWeight="800" color={editingId ? "blue.700" : "#222"} textTransform="uppercase" letterSpacing="0.5px" mb="20px" pb="10px" borderBottom="2px solid #EAEAEA">
                        {editingId ? "CHỈNH SỬA DANH MỤC" : "THÊM DANH MỤC MỚI"}
                    </Text>
                    <form onSubmit={handleSubmit}>
                        <Flex direction="column" gap="15px">
                            <Box>
                                <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase">Tên danh mục *</Text>
                                <Input
                                    variant="outline"
                                    borderRadius="0px"
                                    focusBorderColor={editingId ? "blue.500" : omegaGreen}
                                    h="40px" fontSize="13px" type="text"
                                    placeholder="Nhập tên danh mục..."
                                    fontWeight="500"
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    required
                                />
                            </Box>

                            <Box>
                                <Text fontSize="11px" fontWeight="800" color="gray.700" mb="6px" textTransform="uppercase">Mô tả danh mục</Text>
                                <Input
                                    variant="outline"
                                    borderRadius="0px"
                                    focusBorderColor={editingId ? "blue.500" : omegaGreen}
                                    h="40px" fontSize="13px" type="text"
                                    placeholder="Nhập mô tả danh mục..."
                                    fontWeight="500"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </Box>

                            {editingId ? (
                                <HStack spacing="10px">
                                    <Button type="submit" bg={omegaBlue} color="white" _hover={{ bg: "#0F2340" }} size="lg" fontSize="12px" fontWeight="800" borderRadius="0px" h="45px" flex={2}>
                                        LƯU THAY ĐỔI
                                    </Button>
                                    <Button type="button" onClick={cancelEdit} bg="gray.400" color="white" _hover={{ bg: "gray.500" }} size="lg" fontSize="12px" fontWeight="800" borderRadius="0px" h="45px" flex={1}>
                                        HỦY
                                    </Button>
                                </HStack>
                            ) : (
                                <Button type="submit" bg={omegaGreen} color="white" _hover={{ bg: "#750808" }} size="lg" fontSize="12px" fontWeight="800" borderRadius="0px" h="45px" w="100%">
                                    THÊM MỚI
                                </Button>
                            )}
                        </Flex>
                    </form>
                </Box>

                {/* DANH SÁCH BẢNG HIỂN THỊ */}
                <Box flex={2} bg="white" border="1px solid #EAEAEA" p="24px" w="100%" borderRadius="0px">
                    <Text fontSize="13px" fontWeight="800" color="#222" textTransform="uppercase" letterSpacing="0.5px" mb="20px" pb="10px" borderBottom="2px solid #EAEAEA">
                        DANH SÁCH DANH MỤC ({categories.length})
                    </Text>
                    <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead bg={omegaGrayBg}>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <Tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <Th key={header.id} py="12px" borderColor="#EAEAEA" cursor="pointer" onClick={header.column.getToggleSortingHandler()}>
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
                                        <Td colSpan="4" textAlign="center" py="40px" fontSize="12px" fontWeight="bold" color="gray.400">
                                            Chưa có danh mục nào được khởi tạo.
                                        </Td>
                                    </Tr>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <Tr key={row.id} _hover={{ bg: "gray.50" }} borderBottom="1px solid #EAEAEA" bg={editingId === row.original.categoryId ? "blue.50" : "transparent"}>
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

            <Box bg="white" borderTop="1px solid #EAEAEA" py="20px" textAlign="center" fontSize="11px" color="gray.400" fontWeight="bold">
                Copyright © 2026 honvietfoods. Powered by Yuri Project (Hệ thống quản trị nội bộ)
            </Box>
        </Box>
    );
}